#pragma once

#include "WidgetBlueprintCompiler.h"

class FReactorUMGBlueprintCompilerContext : public FWidgetBlueprintCompilerContext
{
protected:

	typedef FWidgetBlueprintCompilerContext Super;

public:
	FReactorUMGBlueprintCompilerContext(class UReactorUMGWidgetBlueprint* SourceBlueprint,
		FCompilerResultsLog& InMessageLog, const FKismetCompilerOptions& InCompilerOptions);
	virtual ~FReactorUMGBlueprintCompilerContext();

	// FKismetCompilerContext interface
	virtual void SpawnNewClass(const FString& NewClassName) override;
	virtual void EnsureProperGeneratedClass(UClass*& TargetClass) override;
	virtual void CopyTermDefaultsToDefaultObject(UObject* DefaultObject) override;
	virtual void FinishCompilingClass(UClass* Class) override;
	// End of FKismetCompilerContext interface
};

