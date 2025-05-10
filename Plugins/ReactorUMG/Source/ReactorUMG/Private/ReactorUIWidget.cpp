#include "ReactorUIWidget.h"
#include "JsBridgeCaller.h"
#include "JsEnvRuntime.h"
#include "LogReactorUMG.h"
#include "Blueprint/WidgetTree.h"

UReactorUIWidget::UReactorUIWidget(const FObjectInitializer& ObjectInitializer)
	: Super(ObjectInitializer)
{

}

void UReactorUIWidget::BeginDestroy()
{
	Super::BeginDestroy();
}

#if WITH_EDITOR
const FText UReactorUIWidget::GetPaletteCategory()
{
	return NSLOCTEXT("ReactorUMG", "UIWidget", "ReactorUMG");
}
#endif

void UReactorUIWidget::init()
{
	if (!WidgetName.IsEmpty() && !UJsBridgeCaller::IsExistBridgeCaller(WidgetName))
	{
		TArray<TPair<FString, UObject*>> Arguments;
		UJsBridgeCaller* Caller = UJsBridgeCaller::AddNewBridgeCaller(WidgetName);
		Arguments.Add(TPair<FString, UObject*>(TEXT("BridgeCaller"), Caller));
		Arguments.Add(TPair<FString, UObject*>(TEXT("CoreWidget"), this));

		JsEnv = FJsEnvRuntime::GetInstance().GetFreeJsEnv();
		if (JsEnv)
		{
		
			const bool Result = FJsEnvRuntime::GetInstance().StartJavaScript(JsEnv, LaunchJsScriptPath, Arguments);
			if (!Result)
			{
				UJsBridgeCaller::RemoveBridgeCaller(WidgetName);
				ReleaseJsEnv();
				UE_LOG(LogReactorUMG, Warning, TEXT("Start ui javascript file %s failed"), *LaunchJsScriptPath);
			}
		}
		else
		{
			UJsBridgeCaller::RemoveBridgeCaller(WidgetName);
			UE_LOG(LogReactorUMG, Error, TEXT("Can not obtain any valid javascript runtime environment"))
			return;
		}
	}
	
	const bool DelegateRunResult = UJsBridgeCaller::ExecuteMainCaller(WidgetName, this);
	if (!DelegateRunResult)
	{
		UJsBridgeCaller::RemoveBridgeCaller(WidgetName);
		ReleaseJsEnv();
		UE_LOG(LogReactorUMG, Warning, TEXT("Not bind any bridge caller for %s"), *WidgetName);
	}
}

UPanelSlot* UReactorUIWidget::AddChild(UWidget* Content)
{
	if (Content == nullptr)
	{
		return nullptr;
	}

	if (RootSlot)
	{
		return nullptr;
	}

	Content->RemoveFromParent();

	EObjectFlags NewObjectFlags = RF_Transactional;
	if (HasAnyFlags(RF_Transient))
	{
		NewObjectFlags |= RF_Transient;
	}

	UPanelSlot* PanelSlot = NewObject<UPanelSlot>(this, UPanelSlot::StaticClass(), FName("PanelSlot_USmartUICoreWidget"), NewObjectFlags);
	PanelSlot->Content = Content;

	Content->Slot = PanelSlot;

	RootSlot = PanelSlot;

	WidgetTree->RootWidget = Content;

	InvalidateLayoutAndVolatility();

	return PanelSlot;
}

bool UReactorUIWidget::RemoveChild(UWidget* Content)
{
	if (Content == nullptr || RootSlot == nullptr || Content != RootSlot->Content)
	{
		return false;
	}
	UPanelSlot* PanelSlot = RootSlot;
	RootSlot = nullptr;

	if (PanelSlot->Content)
	{
		PanelSlot->Content->Slot = nullptr;
	}

	const bool bReleaseChildren = true;
	PanelSlot->ReleaseSlateResources(bReleaseChildren);
	PanelSlot->Parent = nullptr;
	PanelSlot->Content = nullptr;

	WidgetTree->RootWidget = nullptr;

	InvalidateLayoutAndVolatility();

	return true;
}

void UReactorUIWidget::ReleaseJsEnv()
{
	if (JsEnv)
	{
		UE_LOG(LogReactorUMG, Display, TEXT("Release javascript env in order to excuting other script"))
		FJsEnvRuntime::GetInstance().ReleaseJsEnv(JsEnv);
		JsEnv = nullptr;
	}
}

FString UReactorUIWidget::GetWidgetName()
{
	return WidgetName;
}

void UReactorUIWidget::RestartJsScript()
{
	TRACE_CPUPROFILER_EVENT_SCOPE(RestartJsScript)
	TArray<TPair<FString, UObject*>> Arguments;
	UJsBridgeCaller* Caller = UJsBridgeCaller::AddNewBridgeCaller(WidgetName);
	Arguments.Add(TPair<FString, UObject*>(TEXT("BridgeCaller"), Caller));
	Arguments.Add(TPair<FString, UObject*>(TEXT("CoreWidget"), this));
	
	FJsEnvRuntime::GetInstance().RestartJsScripts(ScriptHomeDir, LaunchJsScriptPath, Arguments);
}
