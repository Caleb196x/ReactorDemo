#pragma once
#include "ReactorBlueprintFactory.generated.h"

UCLASS(BlueprintType)
class UReactorBlueprintFactory : public UFactory
{
	GENERATED_UCLASS_BODY()
	
public:
	UPROPERTY(EditAnywhere, Category = NoesisBlueprintFactory, meta = (AllowAbstract = ""))
	TSubclassOf<class UReactorUIWidget> ParentClass;
	
	virtual UObject* FactoryCreateNew(UClass* Class, UObject* Parent, FName Name, EObjectFlags Flags, UObject* Context, FFeedbackContext* Warn) override;
};
