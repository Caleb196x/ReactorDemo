#pragma once
#include "JsEnv.h"
#include "Blueprint/UserWidget.h"
#include "ReactorUIWidget.generated.h"

UCLASS(BlueprintType)
class REACTORUMG_API UReactorUIWidget : public UUserWidget
{
	GENERATED_UCLASS_BODY()
public:
	UFUNCTION(BlueprintCallable, Category = "ReactorUMG | CoreWidget")
	FString GetWidgetName();

	virtual bool Initialize() override;
	virtual void BeginDestroy() override;
	
protected:
	void SetNewWidgetTree();
#if WITH_EDITOR
	virtual const FText GetPaletteCategory() override;
#endif // WITH_EDITOR
	
private:
	void RunScriptToInitWidgetTree();
	void ReleaseJsEnv();
	
	//  js program entry
	FString LaunchScriptPath;

	FString ScriptHomeDir;

	TObjectPtr<UPanelSlot> RootSlot;

	TSharedPtr<puerts::FJsEnv> JsEnv;

	FString WidgetName;

	bool bWidgetTreeInitialized;
};

