#include "ReactorUMGWidgetBlueprint.h"

#include "DirectoryWatcherModule.h"
#include "IDirectoryWatcher.h"
#include "JsBridgeCaller.h"
#include "JsEnvRuntime.h"
#include "LogReactorUMG.h"
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

UReactorUMGWidgetBlueprint::UReactorUMGWidgetBlueprint(const FObjectInitializer& ObjectInitializer)
	: Super(ObjectInitializer), LaunchJsScriptPath(TEXT("")), RootSlot(nullptr), JsEnv(nullptr), bTsScriptsChanged(false)
{
	FString WidgetRelativePathName;

	if (GetPackage())
	{
		const FString PackageName = GetPackage()->GetName();
	}
	WidgetName = GetName();

	TsProjectDir = FPaths::ConvertRelativePathToFull(FReactorUtils::GetTypeScriptHomeDir());
	// TODO@Caleb196x: Widget可能同名的情况，需要加入路径进行区分
	TsScriptHomeFullDir = FPaths::Combine(TsProjectDir, TEXT("src"), TEXT("components"), WidgetName);
	TsScriptHomeRelativeDir = FPaths::Combine(TEXT("src"), TEXT("components"), WidgetName);
	LaunchJsScriptPath = GetLaunchJsScriptPath();
	JSScriptContentDir = FReactorUtils::GetTSCBuildOutDirFromTSConfig(TsProjectDir);

	RegisterBlueprintDeleteHandle();
	// SetupTsScripts();
}

bool UReactorUMGWidgetBlueprint::Rename(const TCHAR* NewName, UObject* NewOuter, ERenameFlags Flags)
{
	bool Res = Super::Rename(NewName, NewOuter, Flags);
	RenameScriptDir(NewName);
	WidgetName = FString(NewName);
	return Res;
}

void UReactorUMGWidgetBlueprint::RenameScriptDir(const TCHAR* NewName)
{
	if (NewName == nullptr)
	{
		// do nothing
		return;
	}

	if (WidgetName.Equals(NewName))
	{
		return;
	}

	const FString NewTsScriptHomeRelativeDir = FPaths::Combine(TEXT("src"), TEXT("components"), NewName);
	const FString NewTsScriptHomeFullDir = FPaths::Combine(TsProjectDir, NewTsScriptHomeRelativeDir);
	
	FString PluginContentDir = FReactorUtils::GetPluginContentDir();
	const FString OldTsScriptHomeDirFullPath = TsScriptHomeFullDir;
	const FString OldJsScriptHomeDirFullPath = FPaths::Combine(PluginContentDir, TEXT("JavaScript"), TsScriptHomeRelativeDir);

	const FString NewTsScriptHomeDirFullPath = NewTsScriptHomeFullDir;
	const FString NewJsScriptHomeDirFullPath = FPaths::Combine(PluginContentDir, TEXT("JavaScript"), NewTsScriptHomeRelativeDir);

	if (FPaths::DirectoryExists(OldTsScriptHomeDirFullPath))
	{
		IFileManager::Get().Move(*NewTsScriptHomeDirFullPath,*OldTsScriptHomeDirFullPath);
	}
	else
	{
		UE_LOG(LogReactorUMG, Warning, TEXT("Not exist %s rename to %s failed"), *OldTsScriptHomeDirFullPath, *NewTsScriptHomeDirFullPath)
	}

	if (FPaths::DirectoryExists(OldJsScriptHomeDirFullPath))
	{
		IFileManager::Get().Move(*NewJsScriptHomeDirFullPath,*OldJsScriptHomeDirFullPath);
	}
	else
	{
		UE_LOG(LogReactorUMG, Warning, TEXT("Not exist %s rename to %s failed"), *OldJsScriptHomeDirFullPath, *NewJsScriptHomeDirFullPath)
	}

	TsScriptHomeFullDir = NewTsScriptHomeFullDir;
	TsScriptHomeRelativeDir = NewTsScriptHomeRelativeDir;
}


void UReactorUMGWidgetBlueprint::RegisterBlueprintDeleteHandle()
{
	IAssetRegistry& AssetRegistry = FModuleManager::LoadModuleChecked<FAssetRegistryModule>("AssetRegistry").Get();
	
	AssetRegistry.OnAssetRemoved().AddLambda([this](const FAssetData& AssetData)
	{
		const FName AssetName = AssetData.AssetName;
		if (this->GetFName() == AssetName)
		{
			const FString TsScriptHomeDirFullPath = TsScriptHomeFullDir;
			if (FPaths::DirectoryExists(TsScriptHomeDirFullPath))
			{
				if (!FReactorUtils::DeleteDirectoryRecursive(TsScriptHomeDirFullPath))
				{
					UE_LOG(LogReactorUMG, Warning, TEXT("Delete %s failed"), *TsScriptHomeDirFullPath);
				}
				else
				{
					UE_LOG(LogReactorUMG, Log, TEXT("Delete %s success when delete smartui blueprint %s"), *TsScriptHomeDirFullPath, *AssetName.ToString());
				}
			}

			const FString JsScriptHomeDirFullPath = FPaths::Combine(FPaths::ProjectContentDir(), TEXT("JavaScript"), TsScriptHomeRelativeDir);
			if (FPaths::DirectoryExists(JsScriptHomeDirFullPath))
			{
				if (!FReactorUtils::DeleteDirectoryRecursive(JsScriptHomeDirFullPath))
				{
					UE_LOG(LogReactorUMG, Warning, TEXT("Delete %s failed"), *JsScriptHomeDirFullPath);
				}
				else
				{
					UE_LOG(LogReactorUMG, Log, TEXT("Delete %s success when delete smartui blueprint %s"), *JsScriptHomeDirFullPath, *AssetName.ToString());
				}
			}
			
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

UPanelSlot* UReactorUMGWidgetBlueprint::AddChild(UWidget* Content)
{
	if (Content == nullptr)
	{
		return nullptr;
	}

	Content->RemoveFromParent();

	EObjectFlags NewObjectFlags = RF_Transactional;
	if (HasAnyFlags(RF_Transient))
	{
		NewObjectFlags |= RF_Transient;
	}

	UPanelSlot* PanelSlot = NewObject<UPanelSlot>(this->WidgetTree, UPanelSlot::StaticClass(), FName("PanelSlot_ReactorUMGWidgetBlueprint"), NewObjectFlags);
	PanelSlot->Content = Content;

	if (RootSlot)
	{
		RootSlot->ReleaseSlateResources(true);
		RootSlot = nullptr;
	}
	
	Content->Slot = PanelSlot;
	RootSlot = PanelSlot;
	
	if (WidgetTree)
	{
		WidgetTree->RootWidget = Content;
	}

	return PanelSlot;
}

bool UReactorUMGWidgetBlueprint::RemoveChild(UWidget* Content)
{
	if (Content == nullptr || RootSlot == nullptr ||
		Content != RootSlot->Content || !RootSlot->IsValidLowLevel())
	{
		return false;
	}
	
	UPanelSlot* PanelSlot = RootSlot;
	RootSlot = nullptr;

	if (PanelSlot->Content)
	{
		PanelSlot->Content->Slot = nullptr;
	}

	PanelSlot->ReleaseSlateResources(true);
	PanelSlot->Parent = nullptr;
	PanelSlot->Content = nullptr;

	WidgetTree->RootWidget = nullptr;
	return true;
}

void UReactorUMGWidgetBlueprint::ReleaseJsEnv()
{
	if (JsEnv)
	{
		UE_LOG(LogReactorUMG, Display, TEXT("Release javascript env in order to excuting other script"))
		FJsEnvRuntime::GetInstance().ReleaseJsEnv(JsEnv);
		JsEnv = nullptr;
	}
}


void UReactorUMGWidgetBlueprint::SetupTsScripts(bool bForceCompile, bool bForceReload)
{
	FScopedSlowTask SlowTask(2);
	FString CompileOutMessage, CompileErrorMessage;

	// TODO@Caleb196x: 使用JS脚本执行编译TS脚本的工作
	
	if (CheckLaunchJsScriptExist())
	{
		// execute launch.js
		if (bForceCompile)
		{
			
			CompileTsScript();
		}
		SlowTask.EnterProgressFrame(0);
		if (bForceReload)
		{
			ReloadJsScripts();
		} else
		{
			ExecuteJsScripts();
		}
		SlowTask.EnterProgressFrame(1);
	}
	else
	{
		CompileTsScript();
		ExecuteJsScripts();
		SlowTask.EnterProgressFrame(1);
	}

}

void UReactorUMGWidgetBlueprint::ExecuteJsScripts()
{
	TArray<TPair<FString, UObject*>> Arguments;
	Arguments.Add(TPair<FString, UObject*>(TEXT("WidgetBlueprint"), this));
	JsEnv = FJsEnvRuntime::GetInstance().GetFreeJsEnv();
	const bool Result = FJsEnvRuntime::GetInstance().StartJavaScript(JsEnv, LaunchJsScriptPath, Arguments);
	ReleaseJsEnv();
}

void UReactorUMGWidgetBlueprint::ReloadJsScripts()
{
	TRACE_CPUPROFILER_EVENT_SCOPE(ReloadJsScripts)
	TArray<TPair<FString, UObject*>> Arguments;
	Arguments.Add(TPair<FString, UObject*>(TEXT("WidgetBlueprint"), this));
	FJsEnvRuntime::GetInstance().RestartJsScripts(JSScriptContentDir, TsScriptHomeRelativeDir, LaunchJsScriptPath, Arguments);
}

void UReactorUMGWidgetBlueprint::CompileTsScript()
{
	const FString CompileScriptPath = FPaths::Combine(JSScriptContentDir, TEXT("utils/compile.js"));
	const FString BindName = TEXT("TSCompiler");
	ExecuteScriptFunctionViaBridgeCaller(BindName, CompileScriptPath);
}

void UReactorUMGWidgetBlueprint::ExecuteScriptFunctionViaBridgeCaller(const FString& BindName, const FString& ScriptPath)
{
	if (!UJsBridgeCaller::IsExistBridgeCaller(BindName))
	{
		TArray<TPair<FString, UObject*>> Arguments;
		UJsBridgeCaller* Caller = UJsBridgeCaller::AddNewBridgeCaller(BindName);

		Arguments.Add(TPair<FString, UObject*>(TEXT("BridgeCaller"), Caller));
		
		JsEnv = FJsEnvRuntime::GetInstance().GetFreeJsEnv();
		if (JsEnv)
		{
			const bool Result = FJsEnvRuntime::GetInstance().StartJavaScript(JsEnv, ScriptPath, Arguments);
			if (!Result)
			{
				UJsBridgeCaller::RemoveBridgeCaller(BindName);
				ReleaseJsEnv();
				UE_LOG(LogReactorUMG, Warning, TEXT("Execute javascript file %s failed"), *ScriptPath);
			}
		}
		else
		{
			UJsBridgeCaller::RemoveBridgeCaller(BindName);
			UE_LOG(LogReactorUMG, Error, TEXT("Can not obtain any valid javascript runtime environment"))
			return;
		}
		
		ReleaseJsEnv();
	}

	const bool DelegateRunResult = UJsBridgeCaller::ExecuteMainCaller(BindName, this);
	if (!DelegateRunResult)
	{
		UJsBridgeCaller::RemoveBridgeCaller(BindName);
		ReleaseJsEnv();
		UE_LOG(LogReactorUMG, Warning, TEXT("Not bind any bridge caller for %s"), *BindName);
	}
}


void UReactorUMGWidgetBlueprint::SetupMonitorForTsScripts()
{
	// run in editor
	SetupTsScripts();
	
	GEditor->GetEditorSubsystem<UAssetEditorSubsystem>()->OnAssetEditorOpened().AddLambda([](UObject* Asset)
	{
		UE_LOG(LogReactorUMG, Log, TEXT("AssetName: %s, AssetType: %s"), *Asset->GetName(), *Asset->GetClass()->GetName());
		UClass* AssetClass = Asset->GetClass();
		if (UReactorUMGWidgetBlueprint* MyBlueprint = Cast<UReactorUMGWidgetBlueprint>(Asset))
		{
			MyBlueprint->StartTsScriptsMonitor();
		}
	});

	GEditor->GetEditorSubsystem<UAssetEditorSubsystem>()->OnAssetClosedInEditor().AddLambda([](
		UObject* Asset, IAssetEditorInstance* AssetEditorInstance
		)
	{
		UE_LOG(LogReactorUMG, Log, TEXT("AssetName: %s, AssetType: %s"), *Asset->GetName(), *Asset->GetClass()->GetName());
		UClass* AssetClass = Asset->GetClass();
		if (UReactorUMGWidgetBlueprint* MyBlueprint = Cast<UReactorUMGWidgetBlueprint>(Asset))
		{
			MyBlueprint->StopTsScriptsMonitor();
		}
	});
}

bool UReactorUMGWidgetBlueprint::CheckLaunchJsScriptExist()
{
	if (LaunchJsScriptPath.IsEmpty())
	{
		LaunchJsScriptPath = GetLaunchJsScriptPath();
	}
	
	return FPaths::FileExists(LaunchJsScriptPath);
}

void UReactorUMGWidgetBlueprint::StartTsScriptsMonitor()
{
	TsProjectMonitor.Watch(TsScriptHomeFullDir);
	TsMonitorDelegateHandle = TsProjectMonitor.OnDirectoryChanged().AddLambda([this](
			const TArray<FString>& Added, const TArray<FString>& Modified, const TArray<FString>& Removed
		)
	{
		const bool bAnyChange = !Added.IsEmpty() || !Modified.IsEmpty() || !Removed.IsEmpty();
		if (bAnyChange)
		{
			// SetupTsScripts(true, true);
			if (this->MarkPackageDirty())
			{
				FBlueprintEditorUtils::MarkBlueprintAsModified(this);
				UE_LOG(LogReactorUMG, Log, TEXT("Set package blueprint dirty"))
			}

			auto GetDestFilePath = [this](const FString& SourceFilePath) -> FString
			{
				FString LeftDirs, RelativeFileName;
				if (SourceFilePath.Split(TsScriptHomeRelativeDir, &LeftDirs, &RelativeFileName))
				{
					return FPaths::Combine(JSScriptContentDir, TsScriptHomeRelativeDir, RelativeFileName);
				}

				return SourceFilePath;
			};

			// TODO@Caleb196x: 拷贝变化的非脚本文件，删除编译结果目录下的同名文件
			for (const auto& AddFile : Added)
			{
				if (!(AddFile.EndsWith(TEXT(".ts")) ||
					AddFile.EndsWith(TEXT(".tsx"))))
				{
					FString DestFilePath = GetDestFilePath(AddFile);
					FReactorUtils::CopyFile(AddFile, DestFilePath);
				}
			}

			for (const auto& ModifiedFile : Modified)
			{
				if (!(ModifiedFile.EndsWith(TEXT(".ts")) ||
					ModifiedFile.EndsWith(TEXT(".tsx"))))
				{
					FString DestFilePath = GetDestFilePath(ModifiedFile);
					FReactorUtils::CopyFile(ModifiedFile, DestFilePath);
				}
			}

			for (const auto& RemovedFile : Removed)
			{
				FString DestFilePath = GetDestFilePath(RemovedFile);
				
				if (RemovedFile.EndsWith(TEXT(".ts")) ||
					RemovedFile.EndsWith(TEXT(".tsx")))
				{
					DestFilePath = DestFilePath.Replace(TEXT(".ts"), TEXT(".js")).Replace(TEXT(".tsx"), TEXT(".js"));
					FString JsMap = DestFilePath + TEXT(".map");
					FReactorUtils::DeleteFile(JsMap);
				}
				
				FReactorUtils::DeleteFile(DestFilePath);
			}
		}

		// TODO@Caleb196x: 此回调函数可能会被执行多次
	});
}

FString UReactorUMGWidgetBlueprint::GetLaunchJsScriptPath()
{
	if (!JSScriptContentDir.IsEmpty())
	{
		const FString ScriptPath = FPaths::Combine(JSScriptContentDir, TsScriptHomeRelativeDir, TEXT("launch.js"));
		return ScriptPath;
	}

	return TEXT("");
}
