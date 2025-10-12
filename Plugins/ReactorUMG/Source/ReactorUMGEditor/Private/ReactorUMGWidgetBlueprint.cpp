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

UReactorUMGWidgetBlueprint::UReactorUMGWidgetBlueprint(const FObjectInitializer& ObjectInitializer)
	: Super(ObjectInitializer), CompileErrorReporter(nullptr), CustomJSArg(nullptr), RootSlot(nullptr),
		LaunchJsScriptFullPath(TEXT("")), JSScriptContentDir(TEXT("")), JsEnv(nullptr), TSCompileErrorMessageBuffer(TEXT("")), bTsScriptsChanged(false)
{
	if (this->HasAnyFlags(RF_ClassDefaultObject))
	{
		// do nothing for default blueprint
		return;
	}

	// TODO@Caleb196x: Widget可能同名的情况，需要加入路径进行区分
	FString WidgetRelativePathName;

	if (GetPackage())
	{
		const FString PackageName = GetPackage()->GetName();
	}
	
	WidgetName = GetName();

	TsProjectDir = FPaths::ConvertRelativePathToFull(FReactorUtils::GetTypeScriptHomeDir());

	const FString WidgetBPPathName = GetPathName();
	FString Lefts, Rights;
	WidgetBPPathName.Split(".", &Lefts, &Rights);
	const FString ProjectName = FApp::GetProjectName();
	
	TsScriptHomeFullDir = FPaths::Combine(FReactorUtils::GetGamePlayTSHomeDir(), Lefts.Mid(5) /* 排除/Game */);
	TsScriptHomeRelativeDir = TEXT("src/") + ProjectName + Lefts.Mid(5);
	JSScriptContentDir = FReactorUtils::GetTSCBuildOutDirFromTSConfig(TsProjectDir);
	LaunchJsScriptFullPath = GetLaunchJsScriptPath();
	MainScriptPath = GetLaunchJsScriptPath(false);

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
	RenameScriptDir(NewName, NewOuter);
	WidgetName = FString(NewName);
	return Res;
}

void UReactorUMGWidgetBlueprint::RenameScriptDir(const TCHAR* NewName, UObject* NewOuter)
{
	if (NewName == nullptr)
	{
		// do nothing
		return;
	}

	if (WidgetName.Equals(NewName) && NewOuter == GetOuter())
	{
		// do nothing
		return;
	}
	
	const FString WidgetBPPathName = NewOuter->GetPathName();
	const FString ProjectName = FApp::GetProjectName();
	
	const FString NewWidgetRelativePath = TEXT("src/") + ProjectName + WidgetBPPathName.Mid(5);
	const FString NewTsScriptHomeFullDir = FPaths::Combine(FReactorUtils::GetGamePlayTSHomeDir(), WidgetBPPathName.Mid(5) /* 排除/Game */);
	
	const FString OldTsScriptHomeDirFullPath = TsScriptHomeFullDir;
	const FString OldJsScriptHomeDirFullPath = FPaths::Combine(FPaths::ProjectContentDir(), TEXT("JavaScript"), TsScriptHomeRelativeDir);

	const FString NewTsScriptHomeDirFullPath = NewTsScriptHomeFullDir;
	const FString NewJsScriptHomeDirFullPath = FPaths::Combine(FPaths::ProjectContentDir(), TEXT("JavaScript"), NewWidgetRelativePath);

	auto MoveDirectory = [&](const FString& Src, const FString& Dst)
	{
		const FString NewParentDir = FPaths::GetPath(Dst);
		const FString OldParentDir = FPaths::GetPath(Src);
		if (NewParentDir.Equals(OldParentDir))
		{
			IFileManager::Get().Move(*Dst,*Src);
		} else
		{
			FReactorUtils::CopyDirectoryTree(Src, Dst, true);
			FReactorUtils::DeleteDirectoryRecursive(Src);
		}	
	};
	
	if (FPaths::DirectoryExists(OldTsScriptHomeDirFullPath))
	{
		MoveDirectory(OldTsScriptHomeDirFullPath, NewTsScriptHomeDirFullPath);
	}
	else
	{
		UE_LOG(LogReactorUMG, Warning, TEXT("Not exist %s rename to %s failed"), *OldTsScriptHomeDirFullPath, *NewTsScriptHomeDirFullPath)
	}

	if (FPaths::DirectoryExists(OldJsScriptHomeDirFullPath))
	{
		MoveDirectory(OldJsScriptHomeDirFullPath, NewJsScriptHomeDirFullPath);
	}
	else
	{
		UE_LOG(LogReactorUMG, Warning, TEXT("Not exist %s rename to %s failed"), *OldJsScriptHomeDirFullPath, *NewJsScriptHomeDirFullPath)
	}

	TsScriptHomeFullDir = NewTsScriptHomeFullDir;
	TsScriptHomeRelativeDir = NewWidgetRelativePath;
	LaunchJsScriptFullPath = GetLaunchJsScriptPath();
	MainScriptPath = GetLaunchJsScriptPath(false);
}


void UReactorUMGWidgetBlueprint::RegisterBlueprintDeleteHandle()
{
	IAssetRegistry& AssetRegistry = FModuleManager::LoadModuleChecked<FAssetRegistryModule>("AssetRegistry").Get();
	
	AssetRegistry.OnAssetRemoved().AddLambda([this](const FAssetData& AssetData)
	{
		if (!this || this->IsPossiblyDirty()) return;
		
		const FName AssetName = AssetData.AssetName;
		
		if (this && this->GetFName() == AssetName)
		{
			const FString PackagePath = AssetData.PackagePath.ToString();
			const FString AssetPath = PackagePath / AssetName.ToString();
			const FString MyPath = this->GetPathName();
			FString Left, Right;
			MyPath.Split(".", &Left, &Right); 
			const FString PureAssetPath = Left;
			
			if (PureAssetPath.Equals(AssetPath))
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

void UReactorUMGWidgetBlueprint::ReportToMessageLog(const FString& Message)
{
	UE_LOG(LogReactorUMG, Warning, TEXT("%s"), *Message)
	TSCompileErrorMessageBuffer.Append(Message + TEXT("\n"));
}

void UReactorUMGWidgetBlueprint::SetupTsScripts(const FReactorUMGCompilerLog& CompilerResultsLogger, bool bForceCompile, bool bForceReload)
{
	FScopedSlowTask SlowTask(2);
	FString CompileOutMessage, CompileErrorMessage;

	if (!CompileErrorReporter)
	{
		CompileErrorReporter = NewObject<UCompileErrorReport>(this, TEXT("CompileErrorReporter"));

		if (!CompileErrorReporter->CompileReportDelegate.IsBound())
		{
			CompileErrorReporter->CompileReportDelegate.BindDynamic(this, &UReactorUMGWidgetBlueprint::ReportToMessageLog);
		}
	}
	
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

	if (!TSCompileErrorMessageBuffer.IsEmpty())
	{
		CompilerResultsLogger.Error(FText::FromString(TSCompileErrorMessageBuffer));
		TSCompileErrorMessageBuffer.Empty();
	}
}

void UReactorUMGWidgetBlueprint::ExecuteJsScripts()
{
	if (!CustomJSArg) 
	{
		CustomJSArg = NewObject<UCustomJSArg>(this, FName("WidgetBlueprint_CustomArgs"), RF_Transient);
	}
	
	CustomJSArg->bIsUsingBridgeCaller = false;
	TArray<TPair<FString, UObject*>> Arguments;
	Arguments.Add(TPair<FString, UObject*>(TEXT("WidgetTree"), this->WidgetTree));
	Arguments.Add(TPair<FString, UObject*>(TEXT("CustomArgs"), CustomJSArg));
	JsEnv = FJsEnvRuntime::GetInstance().GetFreeJsEnv();
	const bool Result = FJsEnvRuntime::GetInstance().StartJavaScript(JsEnv, LaunchJsScriptFullPath, Arguments);
	ReleaseJsEnv();
}

void UReactorUMGWidgetBlueprint::ReloadJsScripts()
{
	if (!CustomJSArg)
	{
		CustomJSArg = NewObject<UCustomJSArg>(this, FName("WidgetBlueprint_CustomArgs"), RF_Transient);
	}
	
	CustomJSArg->bIsUsingBridgeCaller = false;
	TRACE_CPUPROFILER_EVENT_SCOPE(ReloadJsScripts)
	TArray<TPair<FString, UObject*>> Arguments;
	Arguments.Add(TPair<FString, UObject*>(TEXT("WidgetTree"), this->WidgetTree));
	Arguments.Add(TPair<FString, UObject*>(TEXT("CustomArgs"), CustomJSArg));
	FJsEnvRuntime::GetInstance().RestartJsScripts(JSScriptContentDir, TsScriptHomeRelativeDir, LaunchJsScriptFullPath, Arguments);
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
	if (LaunchJsScriptFullPath.IsEmpty())
	{
		LaunchJsScriptFullPath = GetLaunchJsScriptPath();
	}
	
	return FPaths::FileExists(LaunchJsScriptFullPath);
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
				UE_LOG(LogReactorUMG, Log, TEXT("Set package reactorUMG blueprint dirty"))
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
	});
}

FString UReactorUMGWidgetBlueprint::GetLaunchJsScriptPath(bool bForceFullPath)
{
	if (!JSScriptContentDir.IsEmpty() && bForceFullPath)
	{
		const FString ScriptPath = FPaths::Combine(JSScriptContentDir, TsScriptHomeRelativeDir, TEXT("launch.js"));
		return ScriptPath;
	} else
	{
		return FPaths::Combine( TsScriptHomeRelativeDir, TEXT("launch"));
	}
}
