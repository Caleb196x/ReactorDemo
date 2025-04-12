import * as UE from 'ue';
import { ComponentWrapper } from "./common_wrapper";
import { parseAspectRatio, safeParseFloat } from './common_utils';

export class SizeBoxWrapper extends ComponentWrapper {
    private keyMap: Record<string, string> = {
        'width': 'WidthOverride',
        'height': 'HeightOverride',
        'minWidth': 'MinDesiredWidth',
        'minHeight': 'MinDesiredHeight',
        'maxWidth': 'MaxDesiredWidth',
        'maxHeight': 'MaxDesiredHeight',
        'minAspectRatio': 'MinAspectRatio',
        'maxAspectRatio': 'MaxAspectRatio',
    };

    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    override convertToWidget(): UE.Widget {
        const sizeBox = new UE.SizeBox();
        this.commonPropertyInitialized(sizeBox);
        if (this.props) {
            for (const key in this.props) {
                if (this.keyMap[key]) {
                    const value = this.props[key];
                    if (typeof value === 'number') {
                        sizeBox[this.keyMap[key]] = value;
                    } else if (typeof value === 'string') {
                        if (key == 'minAspectRatio' || key == 'maxAspectRatio') {
                            sizeBox[this.keyMap[key]] = parseAspectRatio(value);
                        } else {
                            sizeBox[this.keyMap[key]] = safeParseFloat(value);
                        }
                    }
                }
            }
        }

        UE.UMGManager.SynchronizeWidgetProperties(sizeBox);

        return sizeBox;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        const overlay = widget as UE.Overlay;
        let propsChange = false;
        return propsChange;
    }
}

