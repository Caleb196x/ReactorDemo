import * as UE from "ue";
import { convertPadding } from "./css_margin_parser";

export function parseWidgetSelfAlignment(style: any) {
    let alignment = {
        horizontal: UE.EHorizontalAlignment.HAlign_Fill,
        vertical: UE.EVerticalAlignment.VAlign_Fill,
        padding: new UE.Margin(0, 0, 0, 0)
    }

    const justifySelf = style?.justifySelf;
    if (justifySelf) {
        switch (justifySelf) {
            case 'start':
                alignment.horizontal = UE.EHorizontalAlignment.HAlign_Left;
                break;
            case 'end':
                alignment.horizontal = UE.EHorizontalAlignment.HAlign_Right;
                break;
            case 'center':
                alignment.horizontal = UE.EHorizontalAlignment.HAlign_Center;
                break;
            case 'stretch':
                alignment.horizontal = UE.EHorizontalAlignment.HAlign_Fill;
                break;
            case 'left':
                alignment.horizontal = UE.EHorizontalAlignment.HAlign_Left;
                break;
            case 'right':
                alignment.horizontal = UE.EHorizontalAlignment.HAlign_Right;
                break;
            default:

                alignment.horizontal = UE.EHorizontalAlignment.HAlign_Center;
                break;
        }
    }

    const alignSelf = style?.alignSelf;
    if (alignSelf) {
        switch (alignSelf) {
            case 'start':
                alignment.vertical = UE.EVerticalAlignment.VAlign_Top;
                break;
            case 'end':
                alignment.vertical = UE.EVerticalAlignment.VAlign_Bottom;
                break;
            case 'center':
                alignment.vertical = UE.EVerticalAlignment.VAlign_Center;
                break;
            case 'stretch':
                alignment.vertical = UE.EVerticalAlignment.VAlign_Fill;
                break;
            case 'top':
                alignment.vertical = UE.EVerticalAlignment.VAlign_Top;
                break;
            case 'bottom':
                alignment.vertical = UE.EVerticalAlignment.VAlign_Bottom;
                break;
            default:
                alignment.vertical = UE.EVerticalAlignment.VAlign_Center;
                break;
        }
    }

    alignment.padding = convertPadding(style);

    return alignment;
}

export function parseFlexHorizontalAlignmentActions() {
    return {
        justifySelf: {
            'flex-start': (slot: UE.HorizontalBoxSlot) => 
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Left),
            'flex-end': (slot: UE.HorizontalBoxSlot) => 
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Right),
            'left': (slot: UE.HorizontalBoxSlot) => 
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Left),
            'right': (slot: UE.HorizontalBoxSlot) => 
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Right),
            'start': (slot: UE.HorizontalBoxSlot) => 
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Left),
            'end': (slot: UE.HorizontalBoxSlot) => 
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Right),
            'center': (slot: UE.HorizontalBoxSlot) => 
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Center),
            'stretch': (slot: UE.HorizontalBoxSlot) => 
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Fill)
        },
        alignSelf: {
            'stretch': (slot: UE.HorizontalBoxSlot) => 
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Fill),
            'center': (slot: UE.HorizontalBoxSlot) => 
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Center),
            'flex-start': (slot: UE.HorizontalBoxSlot) => 
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Top),
            'flex-end': (slot: UE.HorizontalBoxSlot) => 
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Bottom),
            'start': (slot: UE.HorizontalBoxSlot) => 
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Top),
            'end': (slot: UE.HorizontalBoxSlot) => 
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Bottom),
            'top': (slot: UE.HorizontalBoxSlot) => 
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Top),
            'bottom': (slot: UE.HorizontalBoxSlot) => 
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Bottom)
        },
        spaceBetween: (slot: UE.HorizontalBoxSlot, flex: number) => 
            slot.SetSize(new UE.SlateChildSize(flex, UE.ESlateSizeRule.Fill))
    };
}

export function parseFlexVerticalAlignmentActions() {
    return {
        justifySelf: {
            'flex-start': (slot: UE.VerticalBoxSlot) => 
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Top),
            'flex-end': (slot: UE.VerticalBoxSlot) => 
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Bottom),
            'start': (slot: UE.VerticalBoxSlot) => 
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Top),
            'end': (slot: UE.VerticalBoxSlot) => 
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Bottom),
            'left': (slot: UE.VerticalBoxSlot) => 
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Top),
            'right': (slot: UE.VerticalBoxSlot) => 
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Bottom),
            'center': (slot: UE.VerticalBoxSlot) => 
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Center),
            'stretch': (slot: UE.VerticalBoxSlot) => 
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Fill)
        },
        alignSelf: {
            'stretch': (slot: UE.VerticalBoxSlot) => 
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Fill),
            'center': (slot: UE.VerticalBoxSlot) => 
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Center),
            'flex-start': (slot: UE.VerticalBoxSlot) => 
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Left),
            'flex-end': (slot: UE.VerticalBoxSlot) => 
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Right),
            'start': (slot: UE.VerticalBoxSlot) => 
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Left),
            'end': (slot: UE.VerticalBoxSlot) => 
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Right),
            'top': (slot: UE.VerticalBoxSlot) => 
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Left),
            'bottom': (slot: UE.VerticalBoxSlot) => 
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Right)
        },
        spaceBetween: (slot: UE.VerticalBoxSlot, flex: number) => 
            slot.SetSize(new UE.SlateChildSize(flex, UE.ESlateSizeRule.Fill))
    };
}
