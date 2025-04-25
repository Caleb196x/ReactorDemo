import * as UE from "ue";
import { ContainerConverter } from "./container_converter";

export class FlexConverter extends ContainerConverter {

    constructor(typeName: string, props: any) {
        super(typeName, props);
    }

    createNativeWidget(): UE.Widget {
        const widget = new UE.HorizontalBox();
        return widget;
    }

    update(widget: UE.Widget, oldProps: any, newProps: any): void {
        
    }

    appendChild(parent: UE.Widget, child: UE.Widget, childTypeName: string, childProps: any): void {
        
    }

    removeChild(parent: UE.Widget, child: UE.Widget): void {

    }
}
