// Copyright Epic Games, Inc. All Rights Reserved.

#include "ReactorUMG.h"
#include "Widgets/Notifications/SNotificationList.h"
#include "Framework/Notifications/NotificationManager.h"
#include "ReactorUtils.h"
#include "TypeScriptDeclarationGenerator.h"

#define LOCTEXT_NAMESPACE "FReactorUMGModule"

#if WITH_EDITOR
void ShowGeneratedDialog(const FString& OutDir)
{
	FString DialogMessage = FString::Printf(TEXT("Type files genertate finished! \n *.d.ts store in %s"), *OutDir);

	FText DialogText = FText::Format(LOCTEXT("PluginButtonDialogText", "{0}"), FText::FromString(DialogMessage));
	FNotificationInfo Info(DialogText);
	Info.bFireAndForget = true;
	Info.FadeInDuration = 0.0f;
	Info.FadeOutDuration = 5.0f;
	FSlateNotificationManager::Get().AddNotification(Info);
}

void GenerateUEDeclaration(const FName& SearchPath, bool GenFull)
{
	const FString TypesHomeDir = FPaths::Combine(FReactorUtils::GetTypeScriptHomeDir(), TEXT("src"), TEXT("types"));
	FReactorUtils::CreateDirectoryRecursive(TypesHomeDir);
	
	FTypeScriptDeclarationGenerator Generator;
	Generator.OutDir = TypesHomeDir;
	Generator.RestoreBlueprintTypeDeclInfos(GenFull);
	Generator.LoadAllWidgetBlueprint(SearchPath, GenFull);
	Generator.GenTypeScriptDeclaration(true, true);

	ShowGeneratedDialog(TypesHomeDir);
}

TUniquePtr<FAutoConsoleCommand> RegisterConsoleCommand()
{
	return MakeUnique<FAutoConsoleCommand>(TEXT("ReactorUMG.GenDTS"), TEXT("Generate *.d.ts type files"),
		FConsoleCommandWithArgsDelegate::CreateLambda([](const TArray<FString>& Args)
		{
			bool GenFull = false;
			 FName SearchPath = NAME_None;

			 for (auto& Arg : Args)
			 {
				 if (Arg.ToUpper().Equals(TEXT("FULL")))
				 {
					 GenFull = true;
				 }
				 else if (Arg.StartsWith(TEXT("PATH=")))
				 {
					 SearchPath = *Arg.Mid(5);
				 }
			 }

			GenerateUEDeclaration(SearchPath, GenFull);
		}));
}

void CopyPredefinedTSProject()
{
	const FString PredefineDir = FPaths::Combine(FReactorUtils::GetPluginDir(), TEXT("Scripts"), TEXT("Project"));
	if (FPaths::DirectoryExists(PredefineDir))
	{
		const FString TSProjectDir = FReactorUtils::GetTypeScriptHomeDir();
		FReactorUtils::CreateDirectoryRecursive(TSProjectDir);

		FReactorUtils::CopyDirectoryTree(PredefineDir, TSProjectDir, true);
	}
}

void CopyPredefinedSystemJSFiles()
{
	const FString SysJSFileDir = FPaths::Combine(FReactorUtils::GetPluginDir(), TEXT("Scripts"),
		TEXT("System"), TEXT("JavaScript"));
	if (FPaths::DirectoryExists(SysJSFileDir))
	{
		const FString DestDir = FPaths::Combine(FPaths::ProjectContentDir(), TEXT("JavaScript"));
		FReactorUtils::CreateDirectoryRecursive(DestDir);

		FReactorUtils::CopyDirectoryTree(SysJSFileDir, DestDir, false);
	}
}

void SetJSDirToNonAssetPackageList()
{
	FString ConfigFilePath = FPaths::ProjectConfigDir() / TEXT("DefaultGame.ini");

	FString Section = TEXT("/Script/UnrealEd.ProjectPackagingSettings");
	FString Key = TEXT("DirectoriesToAlwaysStageAsUFS");
	FString PathToStage = TEXT("(Path=\"JavaScript\")");
	
	TArray<FString> ExistingValues;
	GConfig->GetArray(*Section, *Key, ExistingValues, ConfigFilePath);

	if (!ExistingValues.Contains(PathToStage))
	{
		ExistingValues.Add(PathToStage);
		GConfig->SetArray(*Section, *Key, ExistingValues, ConfigFilePath);
		GConfig->Flush(false, ConfigFilePath);
	}
}

#endif

void FReactorUMGModule::StartupModule()
{
	// todo@Caleb196x: 生成types文件
#if WITH_EDITOR
	CopyPredefinedTSProject();
	CopyPredefinedSystemJSFiles();
	GenerateUEDeclaration(NAME_None, false);
	RegisterConsoleCommand();
	SetJSDirToNonAssetPackageList();
#endif
}

void FReactorUMGModule::ShutdownModule()
{
	
}

#undef LOCTEXT_NAMESPACE
	
IMPLEMENT_MODULE(FReactorUMGModule, ReactorUMG)