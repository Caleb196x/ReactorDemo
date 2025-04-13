import { ComponentWrapper } from "./common_wrapper";
import * as UE from 'ue';
import { parseBrush } from "./parser/brush_parser";

export class ThrobberWrapper extends ComponentWrapper {
    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    private valueConvertKeyMap: Record<string, string> = {
        'pieces': 'NumberOfPieces',
        'animationHorizontal': 'bAnimationHorizontal',
        'animationVertical': 'bAnimationVertical',
        'animationOpacity': 'bAnimationOpacity',
    }

    override convertToWidget(): UE.Widget {
        const throbber = new UE.Throbber();
        this.commonPropertyInitialized(throbber);

        for (const key in this.props) {
            if (this.valueConvertKeyMap[key]) {
                throbber[this.valueConvertKeyMap[key]] = this.props[key];
            } else if (key === 'image') {
                throbber.Image = parseBrush(this.props[key]);
            }   
        }

        UE.UMGManager.SynchronizeWidgetProperties(throbber);

        return throbber;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        const throbber = widget as UE.Throbber;
        let propsChange = false;
        return propsChange;
    }
}
