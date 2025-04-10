#include "ReactorBlueprintCompiler.h"
#include "ReactorUMGBlueprint.h"
#include "ReactorUMGBlueprintGeneratedClass.h"
#include "ReactorUIWidget.h"
#include "ReactorBlueprintCompilerContext.h"

bool FReactorUMGBlueprintCompiler::CanCompile(const UBlueprint* Blueprint)
{
	return Blueprint->IsA(UReactorUMGBlueprint::StaticClass());
}

void FReactorUMGBlueprintCompiler::PostCompile(UBlueprint* Blueprint)
{
	
}

void FReactorUMGBlueprintCompiler::PreCompile(UBlueprint* Blueprint)
{
	
}

void FReactorUMGBlueprintCompiler::Compile(UBlueprint* Blueprint, const FKismetCompilerOptions& CompilerOptions, FCompilerResultsLog& Results)
{
	// todo: convert typescript to javascript: run tsc command
	if (UReactorUMGBlueprint* SmartUIBlueprint = Cast<UReactorUMGBlueprint>(Blueprint))
	{
		FReactorUMGBlueprintCompilerContext Compiler(SmartUIBlueprint, Results, CompilerOptions);
		Compiler.Compile();
		check(Compiler.NewClass);
	}
}

bool FReactorUMGBlueprintCompiler::GetBlueprintTypesForClass(UClass* ParentClass, UClass*& OutBlueprintClass, UClass*& OutBlueprintGeneratedClass) const
{
	if (ParentClass->IsChildOf<UReactorUIWidget>())
	{
		OutBlueprintClass = UReactorUMGBlueprint::StaticClass();
		OutBlueprintGeneratedClass = UReactorUMGBlueprintGeneratedClass::StaticClass();
		return true;
	}

	return false;
}




