import { ComponentWrapper } from "./common_wrapper";
import * as UE from 'ue';

export class SpacerWrapper extends ComponentWrapper {
    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    override convertToWidget(): UE.Widget {
        const spacer = new UE.Spacer();
        this.commonPropertyInitialized(spacer);
        const size = this.props?.size;
        if (size) {
            spacer.Size = new UE.Vector2D(size.x, size.y);
        }

        UE.UMGManager.SynchronizeWidgetProperties(spacer);

        return spacer;
    }
    
    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        const spacer = widget as UE.Spacer;
        let propsChange = false;
        return propsChange;
    }
}
