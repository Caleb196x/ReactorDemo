import { ComponentWrapper } from "./common_wrapper";
import * as UE from 'ue';
import { parseBrush } from "./parser/brush_parser";

export class CircularThrobberWrapper extends ComponentWrapper {
    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    private valueConvertKeyMap: Record<string, string> = {
        'radius': 'Radius',
        'pieces': 'NumberOfPieces',
        'period': 'Period',
        'enableRadius': 'bEnableRadius',
    }

    override convertToWidget(): UE.Widget {
        const circularThrobber = new UE.CircularThrobber();
        this.commonPropertyInitialized(circularThrobber);

        for (const key in this.props) {
            if (this.valueConvertKeyMap[key]) {
                circularThrobber[this.valueConvertKeyMap[key]] = this.props[key];
            } else if (key === 'image') {
                circularThrobber.Image = parseBrush(this.props[key]);
            }
        }

        UE.UMGManager.SynchronizeWidgetProperties(circularThrobber);

        return circularThrobber;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        const circularThrobber = widget as UE.CircularThrobber;
        let propsChange = false;
        return propsChange;
    }
}