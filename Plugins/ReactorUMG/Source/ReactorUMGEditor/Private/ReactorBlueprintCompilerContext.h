#pragma once

#include "KismetCompiler.h"

class FReactorUMGBlueprintCompilerContext : public FKismetCompilerContext
{
protected:

	typedef FKismetCompilerContext Super;

public:
	FReactorUMGBlueprintCompilerContext(class UReactorUMGBlueprint* SourceBlueprint,
		FCompilerResultsLog& InMessageLog, const FKismetCompilerOptions& InCompilerOptions);
	virtual ~FReactorUMGBlueprintCompilerContext();

	// FKismetCompilerContext interface
	virtual void SpawnNewClass(const FString& NewClassName) override;
	virtual void EnsureProperGeneratedClass(UClass*& TargetClass) override;
	virtual void CopyTermDefaultsToDefaultObject(UObject* DefaultObject) override;
	// End of FKismetCompilerContext interface
};

