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
	
	TsScriptHomeDir = FReactorUtils::GetTypeScriptHomeDir();
	
	TemplateFileDir = FPaths::Combine(TEXT("Template"), TEXT("smart_ui/"));
	JsScriptMainFileName = TEXT("main");

#if WITH_EDITOR
	if (!WidgetName.StartsWith("Default__"))
	{
		CopyTemplateScriptFileToHomeDir();
	}

	RegisterBlueprintDeleteHandle();
#endif
}

#if WITH_EDITOR
void UReactorUMGBlueprint::CopyTemplateScriptFileToHomeDir()
{
	FString PluginContentDir = FReactorUtils::GetPluginContentDir();

	const FString TsScriptHomeDirFullPath = FPaths::Combine(PluginContentDir, TEXT("TypeScript"), TsScriptHomeDir);
	const FString TemplateFileDirFullPath = FPaths::Combine(PluginContentDir, TEXT("TypeScript"), TemplateFileDir);

	if (!FPaths::DirectoryExists(TemplateFileDirFullPath))
	{
		UE_LOG(LogReactorUMG, Error, TEXT("Not exist smart ui template javascript files %s"), *TemplateFileDirFullPath);
		return;
	}
	
	if (!FPaths::DirectoryExists(TsScriptHomeDirFullPath))
	{
		IFileManager::Get().MakeDirectory(*TsScriptHomeDirFullPath);
	}

	if (!FReactorUtils::CopyDirectoryRecursive(TemplateFileDirFullPath, TsScriptHomeDirFullPath, {"components/main_component.tsx"}))
	{
		UE_LOG(LogReactorUMG, Error, TEXT("Copy template script files %s to %s failed."), *TemplateFileDirFullPath, *TsScriptHomeDirFullPath);
	}
}

bool UReactorUMGBlueprint::Rename(const TCHAR* NewName, UObject* NewOuter, ERenameFlags Flags)
{
	bool Res = Super::Rename(NewName, NewOuter, Flags);
	WidgetName = FString(NewName);
	RenameScriptDir(NewName);
	
	return Res;
}

void UReactorUMGBlueprint::RenameScriptDir(const TCHAR* NewName)
{
	if (NewName == nullptr)
	{
		// do nothing
		return;
	}

	FString NewTsScriptHomeDir = TEXT("Main") / WidgetName;
	if (NewTsScriptHomeDir.Equals(TsScriptHomeDir))
	{
		return;
	}
	
	FString PluginContentDir = FReactorUtils::GetPluginContentDir();
	const FString OldTsScriptHomeDirFullPath = FPaths::Combine(PluginContentDir, TEXT("TypeScript"), TsScriptHomeDir);
	const FString OldJsScriptHomeDirFullPath = FPaths::Combine(PluginContentDir, TEXT("JavaScript"), TsScriptHomeDir);

	const FString NewTsScriptHomeDirFullPath = FPaths::Combine(PluginContentDir, TEXT("TypeScript"), NewTsScriptHomeDir);
	const FString NewJsScriptHomeDirFullPath = FPaths::Combine(PluginContentDir, TEXT("JavaScript"), NewTsScriptHomeDir);

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

	TsScriptHomeDir = NewTsScriptHomeDir;
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
			const FString TsScriptHomeDirFullPath = FPaths::Combine(PluginContentDir, TEXT("TypeScript"), TsScriptHomeDir);
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

			const FString JsScriptHomeDirFullPath = FPaths::Combine(PluginContentDir, TEXT("JavaScript"), TsScriptHomeDir);
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
	FString ScriptHomeDir = FPaths::Combine(TsScriptHomeDir, TEXT("components"), WidgetName);
	FReactorUtils::CreateDirectoryRecursive(ScriptHomeDir);
	GenerateLaunchTsxFile(ScriptHomeDir);
	GenerateIndexTsFile(ScriptHomeDir);
	GenerateAppFile(ScriptHomeDir);
}

void UReactorUMGBlueprint::GenerateLaunchTsxFile(const FString& ScriptHome)
{
	const FString LaunchTsxFilePath = FPaths::Combine(ScriptHome, TEXT("launch.tsx"));
	GeneratedTemplateOutput = {"", ""};
	GeneratedTemplateOutput << "/** Note: Automatically generate code, Do not modify it */ \n";
	GeneratedTemplateOutput << "import * as UE from \"ue\";\n";
	GeneratedTemplateOutput << "import { argv } from \"puerts\";\n";
	GeneratedTemplateOutput << "let bridgeCaller = (argv.getByName(\"BridgeCaller\") as UE.JsBridgeCaller);\n";
	GeneratedTemplateOutput << "let coreWidget = (argv.getByName(\"CoreWidget\") as UE.ReactorUIWidget);\n";
	GeneratedTemplateOutput << "bridgeCaller.MainCaller.Bind(Launch);\n";
	GeneratedTemplateOutput << "coreWidget.ReleaseJsEnv();\n";
	GeneratedTemplateOutput << "function Launch(coreWidget: $Nullable<UE.ReactorUIWidget>) : Root {\n";
	GeneratedTemplateOutput << "ReactUMG.init(coreWidget);\n";
	GeneratedTemplateOutput << "return ReactUMG.render(\n";

	const FString ComponentName = FString::Printf(TEXT("<%s/> \n"), *WidgetName);
	GeneratedTemplateOutput << ComponentName;
	GeneratedTemplateOutput << ");\n";
	GeneratedTemplateOutput << "}\n";
	GeneratedTemplateOutput.Indent(4);
	
	GeneratedTemplateOutput.Prefix = TEXT(".tsx");
	FFileHelper::SaveStringToFile(GeneratedTemplateOutput.Buffer, *LaunchTsxFilePath, FFileHelper::EEncodingOptions::ForceUTF8);
}

void UReactorUMGBlueprint::GenerateAppFile(const FString& ScriptHome)
{
	const FString AppFilePath = FPaths::Combine(ScriptHome, WidgetName + TEXT(".tsx"));
	GeneratedTemplateOutput = {"", ""};
	GeneratedTemplateOutput << "/** Note:  */ \n";
	GeneratedTemplateOutput << "import * as UE from \"ue\";\n";

	const FString ClassDeclare = FString::Printf(TEXT("export class %s extends UE.ReactComponent {\n"), *WidgetName);
	GeneratedTemplateOutput << ClassDeclare;
	GeneratedTemplateOutput << "render() {\n";
	GeneratedTemplateOutput << "/* Write your code here */\n";
	GeneratedTemplateOutput << "return <div>Hello ReactorUMG!</div>\n";
	GeneratedTemplateOutput << "}\n";
	GeneratedTemplateOutput << "}\n";

	GeneratedTemplateOutput.Prefix = TEXT(".tsx");
	FFileHelper::SaveStringToFile(GeneratedTemplateOutput.Buffer, *AppFilePath, FFileHelper::EEncodingOptions::ForceUTF8);
}

void UReactorUMGBlueprint::GenerateIndexTsFile(const FString& ScriptHome)
{
	const FString IndexFilePath = FPaths::Combine(ScriptHome, TEXT("index.ts"));
	GeneratedTemplateOutput = {"", ""};
	GeneratedTemplateOutput << "/** Note: Automatically generate code, Do not modify it */ \n";

	const FString Export = FString::Printf(TEXT("export * from \"./%s\"; \n"), *WidgetName);
	GeneratedTemplateOutput << Export;
}

#endif
