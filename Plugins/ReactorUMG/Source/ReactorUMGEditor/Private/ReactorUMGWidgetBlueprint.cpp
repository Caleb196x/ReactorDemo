#include "ReactorUMGWidgetBlueprint.h"

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
	// todo: add path
	TsScriptHomeFullDir = FPaths::Combine(TsProjectDir, TEXT("src"), TEXT("components"), WidgetName);
	TsScriptHomeRelativeDir = FPaths::Combine(TEXT("src"), TEXT("components"), WidgetName);

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
void UReactorUMGWidgetBlueprint::RunScriptBuildCommand()
{
	FString Command = TEXT("yarn build");
	FString Directory = TsProjectDir;  // Assuming TsProjectDir is the path where 'yarn' command is executed

	// Set up pipes for capturing output and error logs
	FString StdOut, StdErr;
	FPlatformProcess::ExecProcess(*Command, *Directory, nullptr, &StdOut, &StdErr);
	
	// Log output and error
	UE_LOG(LogReactorUMG, Log, TEXT("Build Output:\n%s"), *StdOut);
	if (!StdErr.IsEmpty())
	{
		UE_LOG(LogReactorUMG, Error, TEXT("Build Error:\n%s"), *StdErr);
	}
}

void UReactorUMGWidgetBlueprint::SetupMonitorForTsScripts()
{
	
}

void UReactorUMGWidgetBlueprint::CompileTsScripts()
{
	
}

void UReactorUMGWidgetBlueprint::CopyTemplateScriptFileToHomeDir()
{
	
}

void UReactorUMGWidgetBlueprint::ReloadJsScripts()
{
	
}

void UReactorUMGWidgetBlueprint::CheckTsProjectFilesChanged()
{
	
}