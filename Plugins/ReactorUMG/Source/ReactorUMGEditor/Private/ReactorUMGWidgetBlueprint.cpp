#include "ReactorUMGWidgetBlueprint.h"

#include "CustomJSArg.h"
#include "DirectoryWatcherModule.h"
#include "IDirectoryWatcher.h"
#include "JsBridgeCaller.h"
#include "JsEnvRuntime.h"
#include "LogReactorUMG.h"
#include "ReactorBlueprintCompilerContext.h"
#include "ReactorUMGBlueprintGeneratedClass.h"
#include "ReactorUtils.h"
#include "AssetRegistry/AssetRegistryModule.h"
#include "Blueprint/WidgetTree.h"
#include "Kismet2/BlueprintEditorUtils.h"

void FDirectoryMonitor::Watch(const FString& InDirectory)
{
	if (bIsWatching)
	{
		return;
	}
	
	CurrentMonitorDirectory = FPaths::IsRelative(InDirectory) ? FPaths::ConvertRelativePathToFull(InDirectory) : InDirectory;
    // UE_LOG(LogTemp, Warning, TEXT("PEDirectoryWatcher::Watch: %s"), *InDirectory);
    if (IFileManager::Get().DirectoryExists(*CurrentMonitorDirectory))
    {
        auto Changed = IDirectoryWatcher::FDirectoryChanged::CreateLambda(
            [&](const TArray<FFileChangeData>& FileChanges)
            {
                TArray<FString> Added;
                TArray<FString> Modified;
                TArray<FString> Removed;

                for (auto Change : FileChanges)
                {
                    FPaths::NormalizeFilename(Change.Filename);
                    Change.Filename = FPaths::ConvertRelativePathToFull(Change.Filename);
                    switch (Change.Action)
                    {
                        case FFileChangeData::FCA_Added:
                            if (Added.Contains(Change.Filename))
                                continue;
                            Added.Add(Change.Filename);
                            break;
                        case FFileChangeData::FCA_Modified:
                            if (Modified.Contains(Change.Filename))
                                continue;
                            Modified.Add(Change.Filename);
                            break;
                        case FFileChangeData::FCA_Removed:
                            if (Removed.Contains(Change.Filename))
                                continue;
                            Removed.Add(Change.Filename);
                            break;
                        default:
                            continue;
                    }
                }
            	
                if (Added.Num() || Modified.Num() || Removed.Num())
                {
                    OnChanged.Broadcast(Added, Modified, Removed);
                }
            });
    	
        FDirectoryWatcherModule& DirectoryWatcherModule =
            FModuleManager::Get().LoadModuleChecked<FDirectoryWatcherModule>(TEXT("DirectoryWatcher"));
        IDirectoryWatcher* DirectoryWatcher = DirectoryWatcherModule.Get();
        DirectoryWatcher->RegisterDirectoryChangedCallback_Handle(
            CurrentMonitorDirectory, Changed, DelegateHandle, IDirectoryWatcher::IncludeDirectoryChanges);
    	bIsWatching = true;
    } else
    {
	    UE_LOG(LogReactorUMG, Warning, TEXT("PEDirectoryWatcher::Watch: Directory not found: %s"), *InDirectory);
    }
}

void FDirectoryMonitor::UnWatch()
{
	if (DelegateHandle.IsValid())
	{
		FDirectoryWatcherModule& DirectoryWatcherModule =
			FModuleManager::Get().LoadModuleChecked<FDirectoryWatcherModule>(TEXT("DirectoryWatcher"));
		IDirectoryWatcher* DirectoryWatcher = DirectoryWatcherModule.Get();

		DirectoryWatcher->UnregisterDirectoryChangedCallback_Handle(CurrentMonitorDirectory, DelegateHandle);
		CurrentMonitorDirectory = TEXT("");
	}

	bIsWatching = false;
}

UReactorUMGWidgetBlueprint::UReactorUMGWidgetBlueprint(const FObjectInitializer& ObjectInitializer) : Super(ObjectInitializer)
{
	if (this->HasAnyFlags(RF_ClassDefaultObject))
	{
		// do nothing for default blueprint
		return;
	}
	
	ReactorUMGCommonBP = NewObject<UReactorUMGCommonBP>(this, TEXT("ReactorUMGCommonBP_UMGBP"));
	if(!ReactorUMGCommonBP)
	{
		UE_LOG(LogReactorUMG, Warning, TEXT("Create ReactorUMGCommonBP failed, do noting."))
		return;
	}
	
	ReactorUMGCommonBP->WidgetTree = this->WidgetTree;
	ReactorUMGCommonBP->BuildAllNeedPaths(GetName(), GetPathName());

	RegisterBlueprintDeleteHandle();

	FEditorDelegates::OnPreForceDeleteObjects.AddUObject(this, &UReactorUMGWidgetBlueprint::ForceDeleteAssets);
}

void UReactorUMGWidgetBlueprint::ForceDeleteAssets(const TArray<UObject*>& InAssetsToDelete)
{
	UE_LOG(LogReactorUMG, Warning, TEXT("Force delete react umg asset, it will rebuild js env to force release all js object holders."))
	if (InAssetsToDelete.Find(this) != INDEX_NONE)
	{
		FJsEnvRuntime::GetInstance().RebuildRuntimePool();
	}
}

bool UReactorUMGWidgetBlueprint::Rename(const TCHAR* NewName, UObject* NewOuter, ERenameFlags Flags)
{
	bool Res = Super::Rename(NewName, NewOuter, Flags);
	if (ReactorUMGCommonBP)
	{
		ReactorUMGCommonBP->RenameScriptDir(NewName, NewOuter);
		ReactorUMGCommonBP->WidgetName = FString(NewName);
	}
	
	return Res;
}

void UReactorUMGWidgetBlueprint::RegisterBlueprintDeleteHandle()
{
	IAssetRegistry& AssetRegistry = FModuleManager::LoadModuleChecked<FAssetRegistryModule>("AssetRegistry").Get();
	
	AssetRegistry.OnAssetRemoved().AddLambda([this](const FAssetData& AssetData)
	{
		if (this)
		{
			const FName BPName = this->GetFName();
			const FString BPPath = this->GetPathName();
			ReactorUMGCommonBP->DeleteRelativeDirectories(AssetData, BPName, BPPath);
		}
	});
}

UClass* UReactorUMGWidgetBlueprint::GetBlueprintClass() const
{
	return UReactorUMGBlueprintGeneratedClass::StaticClass();
}

bool UReactorUMGWidgetBlueprint::SupportedByDefaultBlueprintFactory() const
{
	return false;
}

void UReactorUMGWidgetBlueprint::SetupTsScripts(const FReactorUMGCompilerLog& CompilerResultsLogger, bool bForceCompile, bool bForceReload)
{
	if (ReactorUMGCommonBP)
	{
		ReactorUMGCommonBP->SetupTsScripts(CompilerResultsLogger, bForceCompile, bForceReload);
	}
}

void UReactorUMGWidgetBlueprint::SetupMonitorForTsScripts()
{
	GEditor->GetEditorSubsystem<UAssetEditorSubsystem>()->OnAssetEditorOpened().AddLambda([this](UObject* Asset)
	{
		UE_LOG(LogReactorUMG, Log, TEXT("Start TS Script Monitor -- AssetName: %s, AssetType: %s"), *Asset->GetName(), *Asset->GetClass()->GetName());
		if (ReactorUMGCommonBP)
		{
			ReactorUMGCommonBP->StartTsScriptsMonitor([this]()
			{
				if (this->MarkPackageDirty())
				{
					FBlueprintEditorUtils::MarkBlueprintAsModified(this);
					UE_LOG(LogReactorUMG, Log, TEXT("Set package reactorUMG blueprint dirty"))
				}
			});
		}
	});

	GEditor->GetEditorSubsystem<UAssetEditorSubsystem>()->OnAssetClosedInEditor().AddLambda([this](
		UObject* Asset, IAssetEditorInstance* AssetEditorInstance
		)
	{
		UE_LOG(LogReactorUMG, Log, TEXT("Stop TS Script Monitor -- AssetName: %s, AssetType: %s"), *Asset->GetName(), *Asset->GetClass()->GetName());
		if (ReactorUMGCommonBP)
		{
			ReactorUMGCommonBP->StopTsScriptsMonitor();
		}
	});
}

