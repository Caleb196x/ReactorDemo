#include "ReactorUMGEditor.h"

#define LOCTEXT_NAMESPACE "FReactorUMGEditorModule"
#include "ReactorUMGBlueprint.h"
#include "ReactorBlueprintCompilerContext.h"
#include "ReactorBlueprintCompiler.h"
#include "AssetToolsModule.h"
#include "ReactorBlueprintAssetTypeActions.h"

TSharedPtr<FKismetCompilerContext> GetCompilerForReactorBlueprint(UBlueprint* Blueprint, FCompilerResultsLog& Results, const FKismetCompilerOptions& CompilerOptions)
{
	UReactorUMGBlueprint* NoesisBlueprint = CastChecked<UReactorUMGBlueprint>(Blueprint);
	return TSharedPtr<FKismetCompilerContext>(new FReactorUMGBlueprintCompilerContext(NoesisBlueprint, Results, CompilerOptions));
}

void FReactorUMGEditorModule::StartupModule()
{
	IAssetTools& AssetTools = FModuleManager::LoadModuleChecked<FAssetToolsModule>("AssetTools").Get();

	EAssetTypeCategories::Type Category = AssetTools.RegisterAdvancedAssetCategory(FName(TEXT("ReactorUMG")),
		LOCTEXT("ReactorUMGCategory", "ReactorUMG"));
	TestBlueprintAssetTypeActions = MakeShareable(new FReactorUMGBlueprintAssetTypeActions(Category));
	AssetTools.RegisterAssetTypeActions(TestBlueprintAssetTypeActions.ToSharedRef());

	// Register blueprint compiler
	ReactorUMGBlueprintCompiler = MakeShareable(new FReactorUMGBlueprintCompiler());
	IKismetCompilerInterface& KismetCompilerModule = FModuleManager::LoadModuleChecked<IKismetCompilerInterface>("KismetCompiler");
	KismetCompilerModule.GetCompilers().Insert(ReactorUMGBlueprintCompiler.Get(), 0); // Make sure our compiler goes before the WidgetBlueprint compiler
	FKismetCompilerContext::RegisterCompilerForBP(UReactorUMGBlueprint::StaticClass(), &GetCompilerForReactorBlueprint);
}

void FReactorUMGEditorModule::ShutdownModule()
{
    
}

#undef LOCTEXT_NAMESPACE
    
IMPLEMENT_MODULE(FReactorUMGEditorModule, ReactorUMGEditor)