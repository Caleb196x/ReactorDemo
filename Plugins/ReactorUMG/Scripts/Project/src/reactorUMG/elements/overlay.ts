import * as UE from 'ue';
import { ComponentWrapper } from "./common_wrapper";
import { convertMargin, mergeClassStyleAndInlineStyle } from './common_utils';

export class OverlayWrapper extends ComponentWrapper {
    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    override convertToWidget(): UE.Widget {
        const overlay = new UE.Overlay();
        this.commonPropertyInitialized(overlay);
        return overlay;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        const overlay = widget as UE.Overlay;
        let propsChange = false;
        return propsChange;
    }

    private setupVerticalAlignment(slot: UE.OverlaySlot, alignSelf: string): void {
        switch (alignSelf) {
            case 'top':
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Top);
                break;
            case 'center':
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Center);
                break;
            case 'bottom':
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Bottom);
                break;
            case 'stretch':
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Fill);
                break;
            case 'start':
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Top);
                break;
            case 'end':
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Bottom);
                break;
            default:
                slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Fill);
                break;
        }
    }

    private setupHorizontalAlignment(slot: UE.OverlaySlot, alignSelf: string): void {
        switch (alignSelf) {
            case 'left':
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Left);
                break;
            case 'center':
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Center);
                break;
            case 'right':
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Right);
                break;
            case 'stretch':
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Fill);
                break;
            case 'start':
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Left);
                break;
            case 'end':
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Right);
                break;
            default:
                slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Fill);
                break;
        }
    }

    override appendChildItem(parentItem: UE.Widget, childItem: UE.Widget, childItemTypeName: string, childProps?: any): void {
        const Overlay = parentItem as UE.Overlay;
        const OverlaySlot = Overlay.AddChildToOverlay(childItem);
        const style = mergeClassStyleAndInlineStyle(childProps);
        if (style) {
            const justifySelf = style.justifySelf;
            const alignSelf = style.alignSelf;
            const padding = style.padding;
            const margin = style.margin;

            this.setupVerticalAlignment(OverlaySlot, alignSelf);
            this.setupHorizontalAlignment(OverlaySlot, justifySelf);
            if (padding) {
                OverlaySlot.SetPadding(convertMargin(padding, style));
            }
            if (margin) {
                OverlaySlot.SetPadding(convertMargin(margin, style));
            }
        }
    }
}

