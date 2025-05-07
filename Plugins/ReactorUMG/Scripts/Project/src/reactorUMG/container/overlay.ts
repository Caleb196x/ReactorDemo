import { parseWidgetSelfAlignment } from "../parsers/alignment_parser";
import { getAllStyles } from "../parsers/cssstyle_parser";
import { ContainerConverter } from "./container_converter";
import * as UE from "ue";

export class OverlayConverter extends ContainerConverter {

    constructor(typeName: string, props: any) {
        super(typeName, props);
    }

    createNativeWidget(): UE.Widget {
        const widget = new UE.Overlay();
        return widget;
    }

    update(widget: UE.Widget, oldProps: any, changedProps: any): void {
        // do nothing
    }

    appendChild(parent: UE.Widget, child: UE.Widget, childTypeName: string, childProps: any): void {
        const overlay = parent as UE.Overlay;
        const overlaySlot = overlay.AddChildToOverlay(child);
        const style = getAllStyles(childTypeName, childProps);
        const alignExist = style?.alignSelf || style?.justifySelf || style?.padding;
        if (alignExist && overlaySlot) {
            const alignment = parseWidgetSelfAlignment(style);
            overlaySlot.SetHorizontalAlignment(alignment.horizontal);
            overlaySlot.SetVerticalAlignment(alignment.vertical);
            overlaySlot.SetPadding(alignment.padding);
        }
    }
}
