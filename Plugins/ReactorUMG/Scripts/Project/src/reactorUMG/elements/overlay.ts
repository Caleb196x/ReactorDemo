import * as UE from 'ue';
import { ComponentWrapper } from "./common_wrapper";

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

    override appendChildItem(parentItem: UE.Widget, childItem: UE.Widget, childItemTypeName: string, childProps?: any): void {
        
    }
}

