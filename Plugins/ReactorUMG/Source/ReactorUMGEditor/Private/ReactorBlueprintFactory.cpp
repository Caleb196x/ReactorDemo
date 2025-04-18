#include "ReactorBlueprintFactory.h"
#include "Kismet2/KismetEditorUtilities.h"
#include "ReactorUMGBlueprint.h"
#include "ReactorUIWidget.h"
#include "ReactorUtils.h"


void TemplateScriptCreator::GenerateTemplateLaunchScripts()
{
	GenerateLaunchTsxFile(TsScriptHomeFullDir);
	GenerateIndexTsFile(TsScriptHomeFullDir);
	GenerateAppFile(TsScriptHomeFullDir);
}

void TemplateScriptCreator::GenerateLaunchTsxFile(const FString& ScriptHome)
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

void TemplateScriptCreator::GenerateAppFile(const FString& ScriptHome)
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

void TemplateScriptCreator::GenerateIndexTsFile(const FString& ScriptHome)
{
	const FString IndexFilePath = FPaths::Combine(ScriptHome, TEXT("index.ts"));
	GeneratedTemplateOutput = {"", ""};
	GeneratedTemplateOutput << "/** Note: Add your components to export */ \n";

	const FString Export = FString::Printf(TEXT("export * from \"./%s\"; \n"), *WidgetName);
	GeneratedTemplateOutput << Export;

	GeneratedTemplateOutput.Prefix = TEXT(".tsx");
	FFileHelper::SaveStringToFile(GeneratedTemplateOutput.Buffer, *IndexFilePath, FFileHelper::EEncodingOptions::ForceUTF8);
}

UReactorBlueprintFactory::UReactorBlueprintFactory(const FObjectInitializer& ObjectInitializer)
	: Super(ObjectInitializer)
{
	bCreateNew = true;
	SupportedClass = UReactorUMGBlueprint::StaticClass();
	ParentClass = UReactorUIWidget::StaticClass();
}

UObject* UReactorBlueprintFactory::FactoryCreateNew(UClass* Class, UObject* Parent, FName Name, EObjectFlags Flags, UObject* Context, FFeedbackContext* Warn)
{
	if ((ParentClass == NULL) || !FKismetEditorUtilities::CanCreateBlueprintOfClass(ParentClass) || !ParentClass->IsChildOf(UReactorUIWidget::StaticClass()))
	{
		FFormatNamedArguments Args;
		Args.Add(TEXT("ClassName"), (ParentClass != NULL) ? FText::FromString(
			ParentClass->GetName()) : NSLOCTEXT("ReactorUIWidget", "Null", "(null)"));
		FMessageDialog::Open(EAppMsgType::Ok, FText::Format(NSLOCTEXT("ReactorUIWidget", "CannotCreateReactorUMGBlueprint",
			"Cannot create a ReactorUIWidget based on the class '{ClassName}'."), Args));
		return nullptr;
	}

	const FString WidgetName = Name.ToString();
	const FString TsScriptHomeFullDir = FPaths::Combine(FReactorUtils::GetTypeScriptHomeDir(), TEXT("src"), TEXT("components"), WidgetName);
	FReactorUtils::CreateDirectoryRecursive(TsScriptHomeFullDir);
	TemplateScriptCreator Generator(TsScriptHomeFullDir, WidgetName);
	Generator.GenerateTemplateLaunchScripts();
	
	return CastChecked<UReactorUMGBlueprint>(FKismetEditorUtilities::CreateBlueprint(ParentClass, Parent, Name, BPTYPE_Normal,
		UReactorUMGBlueprint::StaticClass(), UBlueprintGeneratedClass::StaticClass(),
		"ReactorBlueprintFactory"));
}
