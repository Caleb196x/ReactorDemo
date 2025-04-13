import * as UE from 'ue';
import { ComponentWrapper } from "./common_wrapper";

export class InvalidationBoxWrapper extends ComponentWrapper {
    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    override convertToWidget(): UE.Widget {
        const invalidationBox = new UE.InvalidationBox();
        this.commonPropertyInitialized(invalidationBox);

        const cache = this.props?.cache;
        if (cache) {
            invalidationBox.SetCanCache(cache);
        }

        return invalidationBox;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        const overlay = widget as UE.Overlay;
        let propsChange = false;
        return propsChange;
    }
}

