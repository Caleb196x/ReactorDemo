#include "ReactCoreWidget.h"
#include "Blueprint/WidgetTree.h"

UReactCoreWidget::UReactCoreWidget(const FObjectInitializer& ObjectInitializer) : Super(ObjectInitializer)
{
    WidgetTree = CreateDefaultSubobject<UWidgetTree>(TEXT("WidgetTree"));
    WidgetTree->SetFlags(RF_Transactional);
}

UPanelSlot* UReactCoreWidget::AddChild(UWidget* Content)
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

    UPanelSlot* PanelSlot = NewObject<UPanelSlot>(this, UPanelSlot::StaticClass(), NAME_None, NewObjectFlags);
    PanelSlot->Content = Content;

    Content->Slot = PanelSlot;

    RootSlot = PanelSlot;

    WidgetTree->RootWidget = Content;

    InvalidateLayoutAndVolatility();

    return PanelSlot;
}

bool UReactCoreWidget::RemoveChild(UWidget* Content)
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
