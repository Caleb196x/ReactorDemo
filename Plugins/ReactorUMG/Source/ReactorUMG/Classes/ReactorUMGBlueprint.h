#pragma once

#include "CoreMinimal.h"
#include "ReactorUMGBlueprint.generated.h"

UCLASS()
class REACTORUMG_API UReactorUMGBlueprint : public UBlueprint
{
	GENERATED_UCLASS_BODY()
	
	UPROPERTY(BlueprintType, EditAnywhere, Category = "ReactorUMG")
	FString TsScriptHomeDir;

	UPROPERTY(BlueprintType, EditAnywhere, Category = "ReactorUMG")
	FString TemplateFileDir;
	
	UPROPERTY(BlueprintType, EditAnywhere, Category = "ReactorUMG")
	FString JsScriptMainFileName;

	UPROPERTY(BlueprintType, EditAnywhere, BlueprintReadWrite, Category = "ReactorUMG")
	FString WidgetName;

	FORCEINLINE FString GetTsScriptHomeDir()
	{
		return TsScriptHomeDir;
	}

	FORCEINLINE FString GetTsScriptMainFileShortPath()
	{
		return TsScriptHomeDir / JsScriptMainFileName;
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
