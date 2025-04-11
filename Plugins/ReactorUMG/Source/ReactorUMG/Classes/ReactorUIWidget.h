#pragma once
#include "JsEnv.h"
#include "Blueprint/UserWidget.h"
#include "ReactorUIWidget.generated.h"

UCLASS(BlueprintType)
class REACTORUMG_API UReactorUIWidget : public UUserWidget
{
	GENERATED_UCLASS_BODY()
public:
	
	UFUNCTION(BlueprintCallable, Category = "SmartUIWorks | CoreWidget")
	UPanelSlot* AddChild(UWidget* Content);

	UFUNCTION(BlueprintCallable, Category = "SmartUIWorks | CoreWidget")
	bool RemoveChild(UWidget* Content);

	UFUNCTION(BlueprintCallable, Category = "SmartUIWorks | CoreWidget")
	void ReleaseJsEnv();

	UFUNCTION(BlueprintCallable, Category = "SmartUIWorks | CoreWidget")
	FString GetWidgetName();

	// test
	UFUNCTION(BlueprintCallable, Category = "SmartUIWorks")
	void RestartJsScript();
	
	virtual void BeginDestroy() override;
	
protected:
	
#if WITH_EDITOR
	virtual const FText GetPaletteCategory() override;
#endif // WITH_EDITOR
	
private:
	void init();
	
	// js程序入口
	FString MainReactJsScriptPath;

	FString ScriptHomeDir;

	TObjectPtr<UPanelSlot> RootSlot;

	TSharedPtr<puerts::FJsEnv> JsEnv;

	FString WidgetName;
};

