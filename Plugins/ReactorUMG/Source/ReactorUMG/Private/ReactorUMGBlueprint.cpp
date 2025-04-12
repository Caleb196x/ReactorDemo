#include "ReactorUMGBlueprint.h"
#include "LogReactorUMG.h"
#include "ReactorUMGBlueprintGeneratedClass.h"
#include "ReactorUMGSetting.h"
#include "AssetRegistry/AssetRegistryModule.h"
#include "ReactorUtils.h"

UReactorUMGBlueprint::UReactorUMGBlueprint(const FObjectInitializer& ObjectInitializer)
	: Super(ObjectInitializer)
{
	WidgetName = GetName();
	
	TsProjectDir = FReactorUtils::GetTypeScriptHomeDir();
	TsScriptHomeFullDir = FPaths::Combine(TsProjectDir, TEXT("src"), TEXT("components"), WidgetName);
	TsScriptHomeRelativeDir = FPaths::Combine(TEXT("src"), TEXT("components"), WidgetName);

#if WITH_EDITOR
	if (!WidgetName.StartsWith("Default__"))
	{
		FReactorUtils::CreateDirectoryRecursive(TsScriptHomeFullDir);
		GenerateTemplateLaunchScripts();
	}

	RegisterBlueprintDeleteHandle();
#endif
}

#if WITH_EDITOR
bool UReactorUMGBlueprint::Rename(const TCHAR* NewName, UObject* NewOuter, ERenameFlags Flags)
{
	bool Res = Super::Rename(NewName, NewOuter, Flags);
	RenameScriptDir(NewName);
	WidgetName = FString(NewName);
	return Res;
}

void UReactorUMGBlueprint::RenameScriptDir(const TCHAR* NewName)
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

void UReactorUMGBlueprint::RegisterBlueprintDeleteHandle()
{
	IAssetRegistry& AssetRegistry = FModuleManager::LoadModuleChecked<FAssetRegistryModule>("AssetRegistry").Get();
	
	AssetRegistry.OnAssetRemoved().AddLambda([this](const FAssetData& AssetData)
	{
		const FName AssetName = AssetData.AssetName;
		if (this->GetFName() == AssetName)
		{
			FString PluginContentDir = FReactorUtils::GetPluginContentDir();
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

			const FString JsScriptHomeDirFullPath = FPaths::Combine(PluginContentDir, TEXT("JavaScript"), TsScriptHomeRelativeDir);
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

UClass* UReactorUMGBlueprint::GetBlueprintClass() const
{
	return UReactorUMGBlueprintGeneratedClass::StaticClass();
}

bool UReactorUMGBlueprint::SupportedByDefaultBlueprintFactory() const
{
	return false;
}

void UReactorUMGBlueprint::GenerateTemplateLaunchScripts()
{
	GenerateLaunchTsxFile(TsScriptHomeFullDir);
	GenerateIndexTsFile(TsScriptHomeFullDir);
	GenerateAppFile(TsScriptHomeFullDir);
}

void UReactorUMGBlueprint::GenerateLaunchTsxFile(const FString& ScriptHome)
{
	const FString LaunchTsxFilePath = FPaths::Combine(ScriptHome, TEXT("launch.tsx"));
	GeneratedTemplateOutput = {"", ""};
	GeneratedTemplateOutput << "/** Note: Automatically generate code, Do not modify it */ \n";
	GeneratedTemplateOutput << "import * as UE from \"ue\";\n";
	GeneratedTemplateOutput << "import { $Nullable, argv } from \"puerts\";\n";
	GeneratedTemplateOutput << "import {ReactorUMG, Root} from \"reactorUMG\";\n";
	GeneratedTemplateOutput << "import * as React from \"react\";\n";

	const FString ImportWidget = FString::Printf(TEXT("import { %s } from \"./%s\"\n"), *WidgetName, *WidgetName);
	GeneratedTemplateOutput << ImportWidget << "\n";
	GeneratedTemplateOutput << "let bridgeCaller = (argv.getByName(\"BridgeCaller\") as UE.JsBridgeCaller);\n";
	GeneratedTemplateOutput << "let coreWidget = (argv.getByName(\"CoreWidget\") as UE.ReactorUIWidget);\n";
	GeneratedTemplateOutput << "bridgeCaller.MainCaller.Bind(Launch);\n";
	GeneratedTemplateOutput << "coreWidget.ReleaseJsEnv();\n";
	GeneratedTemplateOutput << "function Launch(coreWidget: $Nullable<UE.ReactorUIWidget>) : Root {\n";
	GeneratedTemplateOutput << "    ReactorUMG.init(coreWidget);\n";
	GeneratedTemplateOutput << "    return ReactorUMG.render(\n";

	const FString ComponentName = FString::Printf(TEXT("<%s/> \n"), *WidgetName);
	GeneratedTemplateOutput << "       " << ComponentName;
	GeneratedTemplateOutput << "    );\n";
	GeneratedTemplateOutput << "}\n";
	GeneratedTemplateOutput.Indent(4);
	
	GeneratedTemplateOutput.Prefix = TEXT(".tsx");
	FFileHelper::SaveStringToFile(GeneratedTemplateOutput.Buffer, *LaunchTsxFilePath, FFileHelper::EEncodingOptions::ForceUTF8);
}

void UReactorUMGBlueprint::GenerateAppFile(const FString& ScriptHome)
{
	const FString AppFilePath = FPaths::Combine(ScriptHome, WidgetName + TEXT(".tsx"));
	GeneratedTemplateOutput = {"", ""};
	GeneratedTemplateOutput << "import * as UE from \"ue\";\n";
	GeneratedTemplateOutput << "import * as React from \"react\";\n";

	const FString ClassDeclare = FString::Printf(TEXT("export class %s extends React.Component {\n"), *WidgetName);
	GeneratedTemplateOutput << ClassDeclare;
	GeneratedTemplateOutput << "    render() {\n";
	GeneratedTemplateOutput << "        /* Write your code here */\n";
	GeneratedTemplateOutput << "        return <div>Hello ReactorUMG!</div>\n";
	GeneratedTemplateOutput << "    }\n";
	GeneratedTemplateOutput << "}\n";

	GeneratedTemplateOutput.Prefix = TEXT(".tsx");
	FFileHelper::SaveStringToFile(GeneratedTemplateOutput.Buffer, *AppFilePath, FFileHelper::EEncodingOptions::ForceUTF8);
}

void UReactorUMGBlueprint::GenerateIndexTsFile(const FString& ScriptHome)
{
	const FString IndexFilePath = FPaths::Combine(ScriptHome, TEXT("index.ts"));
	GeneratedTemplateOutput = {"", ""};
	GeneratedTemplateOutput << "/** Note: Add your components to export */ \n";

	const FString Export = FString::Printf(TEXT("export * from \"./%s\"; \n"), *WidgetName);
	GeneratedTemplateOutput << Export;

	GeneratedTemplateOutput.Prefix = TEXT(".tsx");
	FFileHelper::SaveStringToFile(GeneratedTemplateOutput.Buffer, *IndexFilePath, FFileHelper::EEncodingOptions::ForceUTF8);
}

#endif
