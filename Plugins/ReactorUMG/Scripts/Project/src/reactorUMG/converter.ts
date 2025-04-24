import * as UE from 'ue';


export abstract class ElementConverter {
    typeName: string;
    props: any;

    constructor(typeName: string, props: any) {
        this.typeName = typeName;
        this.props = props;
    }

    abstract createNativeWidget(): UE.Widget;
    abstract update(widget: UE.Widget, oldProps: any, newProps: any): void;
    abstract appendChild(parent: UE.Widget, child: UE.Widget): void;
    abstract removeChild(parent: UE.Widget, child: UE.Widget): void;
    creatWidget(): UE.Widget {
        let widget = this.createNativeWidget();
        this.initCommonProperties(widget);
        return widget;
    }

    private initCommonProperties(widget: UE.Widget) {

    }
}

export function createElementConverter(typeName: string, props: any): ElementConverter {

    return null;
}
