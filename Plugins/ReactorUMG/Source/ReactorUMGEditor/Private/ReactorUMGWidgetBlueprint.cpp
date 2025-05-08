#include "ReactorUMGWidgetBlueprint.h"

#include "JsBridgeCaller.h"
#include "JsEnvRuntime.h"
#include "LogReactorUMG.h"
#include "ReactorUMGBlueprintGeneratedClass.h"
#include "ReactorUtils.h"
#include "AssetRegistry/AssetRegistryModule.h"
#include "Blueprint/WidgetTree.h"

UReactorUMGWidgetBlueprint::UReactorUMGWidgetBlueprint(const FObjectInitializer& ObjectInitializer)
	: Super(ObjectInitializer), LaunchJsScriptPath(TEXT("")), RootSlot(nullptr), JsEnv(nullptr), bTsScriptsChanged(false)
{
	FString WidgetRelativePathName;

	if (GetPackage())
	{
		const FString PackageName = GetPackage()->GetName();
	}
	WidgetName = GetName();

	TsProjectDir = FReactorUtils::GetTypeScriptHomeDir();
	// TODO@Caleb196x: Widget可能同名的情况，需要加入路径进行区分
	TsScriptHomeFullDir = FPaths::Combine(TsProjectDir, TEXT("src"), TEXT("components"), WidgetName);
	TsScriptHomeRelativeDir = FPaths::Combine(TEXT("src"), TEXT("components"), WidgetName);
	LaunchJsScriptPath = FPaths::Combine(TsScriptHomeFullDir, TEXT("launch.js"));

	RegisterBlueprintDeleteHandle();
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

	if (RootSlot)
	{
		return nullptr;
	}

	Content->RemoveFromParent();

	EObjectFlags NewObjectFlags = RF_Transactional;
	if (HasAnyFlags(RF_Transient))
	{
		NewObjectFlags |= RF_Transient;
	}

	UPanelSlot* PanelSlot = NewObject<UPanelSlot>(this, UPanelSlot::StaticClass(), FName("PanelSlot_ReactorUMGWidgetBlueprint"), NewObjectFlags);
	PanelSlot->Content = Content;

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
bool UReactorUMGWidgetBlueprint::RunScriptBuildCommand(FScopedSlowTask& SlowTask, FString& StdOut, FString& StdErr)
{
	SlowTask.MakeDialog();
	
	const FString Command = TEXT("yarn build");
	const FString WorkDirectory = TsProjectDir;
	const int32 TotalAmountOfWorks = 20;
	
	FProcHandle ProcessHandle;
	void* ReadPipe = nullptr;
	void* WritePipe = nullptr;
	verify(FPlatformProcess::CreatePipe(ReadPipe, WritePipe));
	
	const FString Arguments = TEXT("");
	uint32 ProcessID;
	const bool bLaunchDetached = false;
	const bool bLaunchHidden = true;
	const bool bLaunchReallyHidden = true;
	ProcessHandle = FPlatformProcess::CreateProc(*Command, *Arguments, bLaunchDetached,
		bLaunchHidden, bLaunchReallyHidden, &ProcessID, 0, *WorkDirectory, WritePipe);

	FString LogOutBuffer;
	while (FPlatformProcess::IsProcRunning(ProcessHandle))
	{
		if (SlowTask.ShouldCancel() || GEditor->GetMapBuildCancelled())
		{
			FPlatformProcess::TerminateProc(ProcessHandle);
			break;
		}
		
		FString LogString = FPlatformProcess::ReadPipe(ReadPipe);
		if (!LogString.IsEmpty())
		{
			LogOutBuffer += LogString;
		}
		
		// TODO@Caleb196x: 提取出编译日志
		int NewLineCount = LogString.Len() - LogString.Replace(TEXT("\n"), TEXT("")).Len();

		SlowTask.CompletedWork = NewLineCount;
		SlowTask.TotalAmountOfWork = TotalAmountOfWorks;
		// SlowTask.DefaultMessage = FText::FromString(Regex.GetCaptureGroup(3));

		SlowTask.EnterProgressFrame(0);
		FPlatformProcess::Sleep(0.1);
	}

	FString RemainingData = FPlatformProcess::ReadPipe(ReadPipe);
	if (!RemainingData.IsEmpty())
	{
		LogOutBuffer += RemainingData;
	}
	
	int32 ReturnCode = 0;
	FPlatformProcess::GetProcReturnCode(ProcessHandle, &ReturnCode);
	FPlatformProcess::ClosePipe(ReadPipe, WritePipe);

	UE_LOG(LogReactorUMG, Display, TEXT("Log: %s"), *LogOutBuffer);
	
	if (ReturnCode == 0)
	{
		UE_LOG(LogReactorUMG, Display, TEXT("Compile TypeScript files successfully."));
		StdOut = LogOutBuffer;
		return true;
	}

	StdErr = LogOutBuffer;
	UE_LOG(LogReactorUMG, Display, TEXT("Compile TypeScript files failed, error: %s."), *StdErr);
	return false;
}

void UReactorUMGWidgetBlueprint::CompileTsScripts(bool bCompileAndReload)
{
	FScopedSlowTask SlowTask(10);
	FString CompileOutMessage, CompileErrorMessage;
	
	if (CheckLaunchJsScriptExist())
	{
		// execute launch.js
		if (bCompileAndReload)
		{
			if (RunScriptBuildCommand(SlowTask, CompileOutMessage, CompileErrorMessage))
			{
				ReloadJsScripts();
			} else
			{
				// print error message to editor message log
			}
		} else
		{
			ExecuteJsScripts();
		}
	} else
	{
		if (RunScriptBuildCommand(SlowTask, CompileOutMessage, CompileErrorMessage))
		{
			ExecuteJsScripts();
		} else
		{
			// print error message to editor message log
		}
	}

}

void UReactorUMGWidgetBlueprint::ExecuteJsScripts()
{
	if (!WidgetName.IsEmpty() && !UJsBridgeCaller::IsExistBridgeCaller(WidgetName))
	{
		TArray<TPair<FString, UObject*>> Arguments;
		UJsBridgeCaller* Caller = UJsBridgeCaller::AddNewBridgeCaller(WidgetName);
		Arguments.Add(TPair<FString, UObject*>(TEXT("BridgeCaller"), Caller));
		Arguments.Add(TPair<FString, UObject*>(TEXT("WidgetBlueprint"), this));

		JsEnv = FJsEnvRuntime::GetInstance().GetFreeJsEnv();
		if (JsEnv)
		{
		
			const bool Result = FJsEnvRuntime::GetInstance().StartJavaScript(JsEnv, LaunchJsScriptPath, Arguments);
			if (!Result)
			{
				UJsBridgeCaller::RemoveBridgeCaller(WidgetName);
				ReleaseJsEnv();
				UE_LOG(LogReactorUMG, Warning, TEXT("Start ui javascript file %s failed"), *LaunchJsScriptPath);
			}
		}
		else
		{
			UJsBridgeCaller::RemoveBridgeCaller(WidgetName);
			UE_LOG(LogReactorUMG, Error, TEXT("Can not obtain any valid javascript runtime environment"))
			return;
		}
	}
	
	const bool DelegateRunResult = UJsBridgeCaller::ExecuteMainCaller(WidgetName, this);
	if (!DelegateRunResult)
	{
		UJsBridgeCaller::RemoveBridgeCaller(WidgetName);
		ReleaseJsEnv();
		UE_LOG(LogReactorUMG, Warning, TEXT("Not bind any bridge caller for %s"), *WidgetName);
	}
}

void UReactorUMGWidgetBlueprint::ReloadJsScripts()
{
	TRACE_CPUPROFILER_EVENT_SCOPE(ReloadJsScripts)
	TArray<TPair<FString, UObject*>> Arguments;
	UJsBridgeCaller* Caller = UJsBridgeCaller::AddNewBridgeCaller(WidgetName);
	Arguments.Add(TPair<FString, UObject*>(TEXT("BridgeCaller"), Caller));
	Arguments.Add(TPair<FString, UObject*>(TEXT("CoreWidget"), this));
	
	FJsEnvRuntime::GetInstance().RestartJsScripts(TsScriptHomeFullDir, LaunchJsScriptPath, Arguments);
}

void UReactorUMGWidgetBlueprint::SetupMonitorForTsScripts()
{
	
}


void UReactorUMGWidgetBlueprint::CheckTsProjectFilesChanged()
{
	
}

bool UReactorUMGWidgetBlueprint::CheckLaunchJsScriptExist()
{
	if (LaunchJsScriptPath.IsEmpty())
	{
		const FString ScriptPath = FPaths::Combine(TsScriptHomeFullDir, TEXT("launch.js"));
		LaunchJsScriptPath = ScriptPath;
	}
	
	return FPaths::FileExists(LaunchJsScriptPath);
}