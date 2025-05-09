#pragma once

#include "CoreMinimal.h"
#include "BaseWidgetBlueprint.h"
#include "TypeScriptDeclarationGenerator.h"
#include "WidgetBlueprint.h"
#include "ReactorUMGBlueprint.generated.h"

UCLASS()
class REACTORUMG_API UReactorUMGBlueprint : public UWidgetBlueprint
{
	GENERATED_UCLASS_BODY()
public:
	
	UPROPERTY(BlueprintType, EditAnywhere, Category = "ReactorUMG")
	FString TsProjectDir;
	
	UPROPERTY(BlueprintType, EditAnywhere, Category = "ReactorUMG")
	FString TsScriptHomeFullDir;

	UPROPERTY(BlueprintType, EditAnywhere, Category = "ReactorUMG")
	FString TsScriptHomeRelativeDir;
	
	UPROPERTY(BlueprintType, EditAnywhere, BlueprintReadWrite, Category = "ReactorUMG")
	FString WidgetName;

	FORCEINLINE FString GetTsScriptHomeDir()
	{
		return TsScriptHomeFullDir;
	}

protected:
	
#if WITH_EDITOR
	virtual bool Rename(const TCHAR* NewName = nullptr, UObject* NewOuter = nullptr, ERenameFlags Flags = REN_None) override;

	void CopyTemplateScriptFileToHomeDir();

	void RenameScriptDir(const TCHAR* NewName);

	void RegisterBlueprintDeleteHandle();
	
	UClass* GetBlueprintClass() const;
	bool SupportedByDefaultBlueprintFactory() const;
#endif
	
};
