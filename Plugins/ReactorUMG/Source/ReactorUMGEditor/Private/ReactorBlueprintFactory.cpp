#include "ReactorBlueprintFactory.h"
#include "Kismet2/KismetEditorUtilities.h"
#include "ReactorUMGBlueprint.h"
#include "ReactorUIWidget.h"

UReactorBlueprintFactory::UReactorBlueprintFactory(const FObjectInitializer& ObjectInitializer)
	: Super(ObjectInitializer)
{
	bCreateNew = true;
	SupportedClass = UReactorUMGBlueprint::StaticClass();
	ParentClass = UReactorUIWidget::StaticClass();
}

UObject* UReactorBlueprintFactory::FactoryCreateNew(UClass* Class, UObject* Parent, FName Name, EObjectFlags Flags, UObject* Context, FFeedbackContext* Warn)
{
	if ((ParentClass == NULL) || !FKismetEditorUtilities::CanCreateBlueprintOfClass(ParentClass) || !ParentClass->IsChildOf(UReactorUIWidget::StaticClass()))
	{
		FFormatNamedArguments Args;
		Args.Add(TEXT("ClassName"), (ParentClass != NULL) ? FText::FromString(
			ParentClass->GetName()) : NSLOCTEXT("ReactorUIWidget", "Null", "(null)"));
		FMessageDialog::Open(EAppMsgType::Ok, FText::Format(NSLOCTEXT("ReactorUIWidget", "CannotCreateReactorUMGBlueprint",
			"Cannot create a ReactorUIWidget based on the class '{ClassName}'."), Args));
		return nullptr;
	}
	
	return CastChecked<UReactorUMGBlueprint>(FKismetEditorUtilities::CreateBlueprint(ParentClass, Parent, Name, BPTYPE_Normal,
		UReactorUMGBlueprint::StaticClass(), UBlueprintGeneratedClass::StaticClass(),
		"ReactorBlueprintFactory"));
}
