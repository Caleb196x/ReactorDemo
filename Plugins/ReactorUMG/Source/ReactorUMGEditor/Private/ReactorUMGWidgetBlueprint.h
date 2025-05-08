#pragma once
#include "CoreMinimal.h"
#include "JsEnv.h"
#include "WidgetBlueprint.h"
#include "Components/PanelSlot.h"
#include "ReactorUMGWidgetBlueprint.generated.h"

UCLASS(BlueprintType)
class REACTORUMGEDITOR_API UReactorUMGWidgetBlueprint : public UWidgetBlueprint
{
	GENERATED_UCLASS_BODY()
public:
	UFUNCTION(BlueprintCallable, Category="ReactorUMGEditor|WidgetBlueprint")
	UPanelSlot* AddChild(UWidget* Content);
	
	UFUNCTION(BlueprintCallable, Category="ReactorUMGEditor|WidgetBlueprint")
	bool RemoveChild(UWidget* Content);
	
	UFUNCTION(BlueprintCallable, Category="ReactorUMGEditor|WidgetBlueprint")
	void ReleaseJsEnv();
	
	FORCEINLINE FString GetWidgetName()
	{
		return WidgetName;
	}

	// 在AssetEditorSubsystem的OnAssetOpenedInEditor事件中触发监听模式
	// 在在AssetEditorSubsystem的OnAssetClosedInEditor事件中结束监听模式
	void SetupMonitorForTsScripts();
	
	void CompileTsScripts();
	
protected:
	UPROPERTY(BlueprintType, VisibleAnywhere, Category="ReactorUMGEditor|WidgetBlueprint")
	FString TsProjectDir;

	UPROPERTY(BlueprintType, VisibleAnywhere, Category="ReactorUMGEditor|WidgetBlueprint")
	FString TsScriptHomeFullDir;

	UPROPERTY(BlueprintType, VisibleAnywhere, Category = "ReactorUMGEditor|WidgetBlueprint")
	FString TsScriptHomeRelativeDir;

	UPROPERTY(BlueprintType, VisibleAnywhere, Category = "ReactorUMGEditor|WidgetBlueprint")
	FString WidgetName;
	
	virtual bool Rename(const TCHAR* NewName = nullptr, UObject* NewOuter = nullptr, ERenameFlags Flags = REN_None) override;
	
	void CopyTemplateScriptFileToHomeDir();
	void RenameScriptDir(const TCHAR* NewName);
	void RegisterBlueprintDeleteHandle();
	UClass* GetBlueprintClass() const;
	bool SupportedByDefaultBlueprintFactory() const;
	void ReloadJsScripts();
	void CheckTsProjectFilesChanged();
	void RunScriptBuildCommand();

private:
	FString LaunchJsScriptPath;
	
	TObjectPtr<UPanelSlot> RootSlot;
	
	TSharedPtr<puerts::FJsEnv> JsEnv;
	
	bool bTsScriptsChanged;
};
