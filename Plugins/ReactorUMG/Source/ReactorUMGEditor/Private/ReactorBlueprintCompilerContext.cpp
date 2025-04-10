#include "ReactorBlueprintCompilerContext.h"
#include "ReactorUMGBlueprint.h"
#include "ReactorUMGBlueprintGeneratedClass.h"
#include "Kismet2/KismetReinstanceUtilities.h"

FReactorUMGBlueprintCompilerContext::FReactorUMGBlueprintCompilerContext(UReactorUMGBlueprint* SourceBlueprint,
	FCompilerResultsLog& InMessageLog, const FKismetCompilerOptions& InCompilerOptions)
	: Super(SourceBlueprint, InMessageLog, InCompilerOptions)
{
	
}

FReactorUMGBlueprintCompilerContext::~FReactorUMGBlueprintCompilerContext()
{
	
}

void FReactorUMGBlueprintCompilerContext::EnsureProperGeneratedClass(UClass*& TargetUClass)
{
	if (TargetUClass && !((UObject*)TargetUClass)->IsA(UReactorUMGBlueprintGeneratedClass::StaticClass()))
	{
		FKismetCompilerUtilities::ConsignToOblivion(TargetUClass, Blueprint->bIsRegeneratingOnLoad);
		TargetUClass = nullptr;
	}
}

void FReactorUMGBlueprintCompilerContext::SpawnNewClass(const FString& NewClassName)
{
	UReactorUMGBlueprintGeneratedClass* BlueprintGeneratedClass = FindObject<UReactorUMGBlueprintGeneratedClass>(Blueprint->GetOutermost(), *NewClassName);

	if (BlueprintGeneratedClass == nullptr)
	{
		BlueprintGeneratedClass = NewObject<UReactorUMGBlueprintGeneratedClass>(Blueprint->GetOutermost(), FName(*NewClassName), RF_Public | RF_Transactional);
	}
	else
	{
		FBlueprintCompileReinstancer::Create(BlueprintGeneratedClass);
	}

	NewClass = BlueprintGeneratedClass;
}

void FReactorUMGBlueprintCompilerContext::CopyTermDefaultsToDefaultObject(UObject* DefaultObject)
{
	/*if (USmartUICoreWidget* DefaultInstance = Cast<USmartUICoreWidget>(DefaultObject))
	{
		USmartUIBlueprint* SmartUIBlueprint = CastChecked<USmartUIBlueprint>(Blueprint);
		DefaultInstance->WidgetName = SmartUIBlueprint->WidgetName;
	}*/
}
