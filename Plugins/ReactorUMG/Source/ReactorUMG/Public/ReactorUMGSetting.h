#pragma once
#include "CoreMinimal.h"
#include "Engine/DeveloperSettings.h"
#include "ReactorUMGSetting.generated.h"

UCLASS(Config = Engine, DefaultConfig)
class REACTORUMG_API UReactorUMGSetting : public UDeveloperSettings
{
	GENERATED_BODY()
public:
	UReactorUMGSetting();
	
	UPROPERTY(EditAnywhere,
		  config,
		  Category = "ReactorUMG",
		  DisplayName = "TypeScript Code Home Directory")
	FString TsScriptHomeDir;

	virtual FName GetCategoryName() const override
	{
		return FName(TEXT("ReactorUMG"));
	}
};
