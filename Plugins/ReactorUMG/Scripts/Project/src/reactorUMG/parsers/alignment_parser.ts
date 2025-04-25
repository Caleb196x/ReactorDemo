import * as UE from "ue";
import { convertMargin } from "./css_margin_parser";

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

    const padding = style?.padding;
    if (padding) {
        alignment.padding = convertMargin(padding, style);
    }

    const margin = style?.margin;
    if (margin) {
        alignment.padding = convertMargin(margin, style);
    }

    return alignment;
}