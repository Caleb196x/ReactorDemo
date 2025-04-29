import * as UE from "ue";
import { ElementConverter } from "../converter";
import { ButtonConverter } from "./button";
import { getAllStyles } from "../parsers/cssstyle_parser";

export class JSXConverter extends ElementConverter {
    private nativeSlot: UE.PanelSlot;
    private proxy: ElementConverter;
    widgetStyle: any;

    constructor(typeName: string, props: any) {
        super(typeName, props);

        this.proxy = this.createProxy();
        this.widgetStyle = getAllStyles(this.typeName, this.props);
    }

    private createProxy(): ElementConverter {
        const JsxElementConverters = {
            "button": ButtonConverter,
            
        };

        if (JsxElementConverters.hasOwnProperty(this.typeName)) {
            return new JsxElementConverters[this.typeName](this.typeName, this.props);
        }

        return null;
    }

    createNativeWidget() {
        console.warn("JSXConverter createNativeWidget not implemented, do not use it directly");
        if (this.proxy) {
            return this.proxy.createNativeWidget();
        }

        return null;
    }

    update(widget: UE.Widget, oldProps: any, changedProps: any) {
        if (this.proxy) {
            this.proxy.update(widget, oldProps, changedProps);
        }
    }

    appendChild(parent: UE.Widget, child: UE.Widget, childTypeName: string, childProps: any) {
        if (parent instanceof UE.PanelWidget) {
            const nativeSlot = parent.AddChild(child);
            this.nativeSlot = nativeSlot;
        }
    }

    removeChild(parent: UE.Widget, child: UE.Widget) {
        if (parent instanceof UE.PanelWidget) {
            parent.RemoveChild(child);
        }
    }
}