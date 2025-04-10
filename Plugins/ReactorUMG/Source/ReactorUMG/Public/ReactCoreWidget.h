#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "ReactCoreWidget.generated.h"

UCLASS()
class REACTORUMG_API UReactCoreWidget : public UUserWidget
{
	GENERATED_BODY()

protected:
	UPanelSlot* RootSlot;

public:
	explicit UReactCoreWidget(const FObjectInitializer& ObjectInitializer);

	UFUNCTION(BlueprintCallable, Category = "Scripting | Javascript")
	UPanelSlot* AddChild(UWidget* Content);

	UFUNCTION(BlueprintCallable, Category = "Scripting | Javascript")
	bool RemoveChild(UWidget* Content);
};
