import { getAllStyles } from "../parsers/cssstyle_parser";
import { ContainerConverter } from "./container_converter";
import * as UE from "ue";

export class OverlayConverter extends ContainerConverter {

    constructor(typeName: string, props: any) {
        super(typeName, props);
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

    createNativeWidget(): UE.Widget {
        const widget = new UE.Overlay();
        return widget;
    }

    update(widget: UE.Widget, oldProps: any, changedProps: any): void {
        // do nothing
    }

    appendChild(parent: UE.Widget, child: UE.Widget, childTypeName: string, childProps: any): void {
        const Overlay = parent as UE.Overlay;
        const OverlaySlot = Overlay.AddChildToOverlay(child);
        const style = getAllStyles(childTypeName, childProps);
        if (style) {
            const justifySelf = style.justifySelf;
            const alignSelf = style.alignSelf;

            this.setupVerticalAlignment(OverlaySlot, alignSelf);
            this.setupHorizontalAlignment(OverlaySlot, justifySelf);
        }
    }
}
