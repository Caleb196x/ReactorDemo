#pragma once

#include "CoreMinimal.h"
#include "Modules/ModuleManager.h"

class FReactorUMGEditorModule : public IModuleInterface
{
public:
    virtual void StartupModule() override;
    virtual void ShutdownModule() override;

    void InstallTsScriptNodeModules();
    
    TSharedPtr<class FReactorUMGBlueprintAssetTypeActions> TestBlueprintAssetTypeActions;
    TSharedPtr<class FReactorUMGBlueprintCompiler> ReactorUMGBlueprintCompiler;
    TUniquePtr<FAutoConsoleCommand> ConsoleCommand;

    TUniquePtr<FAutoConsoleCommand> DebugGCConsoleCommand;
};
