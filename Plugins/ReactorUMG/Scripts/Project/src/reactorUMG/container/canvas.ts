import { ContainerConverter } from "./container_converter";
import * as UE from "ue";

export class CanvasConverter extends ContainerConverter {

    constructor(typeName: string, props: any) {
        super(typeName, props);
    }
    
    createNativeWidget(): UE.Widget {
        const widget = new UE.CanvasPanel();
        return widget;
    }

    update(widget: UE.Widget, oldProps: any, newProps: any): void {
        
    }

    appendChild(parent: UE.Widget, child: UE.Widget, childTypeName: string, childProps: any): void {

    }
    
    removeChild(parent: UE.Widget, child: UE.Widget): void {

    }
}
