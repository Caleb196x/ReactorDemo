import { ComponentWrapper } from "./common_wrapper";
import * as UE from 'ue';
import { parseBrush } from "./parser/brush_parser";
import { convertMargin } from "./common_utils";
import { parseColor } from "./parser/color_parser";

export class SpinBoxWrapper extends ComponentWrapper {
    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    private valueConvertKeyMap: Record<string, string> = {
        'value': 'Value',
        'minValue': 'MinValue',
        'maxValue': 'MaxValue',
        'minSliderValue': 'MinSliderValue',
        'maxSliderValue': 'MaxSliderValue',
        'minFractionDigits': 'MinFractionDigits',
        'maxFractionDigits': 'MaxFractionDigits',
        'useDeltaSnap': 'bAlwaysUsesDeltaSnap',
        'enableSlider': 'bEnableSlider',
        'deltaValue': 'Delta',
        'sliderExponent': 'SliderExponent',
        'minDesiredWidth': 'MinDesiredWidth',
        'clearKeyboardFocusOnCommit': 'ClearKeyboardFocusOnCommit',
        'selectAllTextOnFocus': 'SelectAllTextOnCommit',
        'foregroundColor': 'ForegroundColor',
    }

    private eventKeyMap: Record<string, string> = {
        'onValueChanged': 'OnValueChanged',
        'onValueCommitted': 'OnValueCommitted',
        'onBeginSliderMovement': 'OnBeginSliderMovement',
        'onEndSliderMovement': 'OnEndSliderMovement',
    }

    private styleKeyMap: Record<string, string> = {
        'arrowBackground': 'ArrowImage',
        'normalBackground': 'BackgroundBrush',
        'activeBackground': 'ActiveBackgroundBrush',
        'hoveredBackground': 'HoveredBackgroundBrush',
        'activeFillBackground': 'ActiveFillBrush',
        'hoveredFillBackground': 'HoveredFillBrush',
        'inactiveFillBackground': 'InactiveFillBrush',
    }

    private paddingKeyMap: Record<string, string> = {
        'textPadding': 'TextPadding',
        'insetPadding': 'InsetPadding',
    }

    private colorKeyMap: Record<string, string> = {
        'foregroundColor': 'ForegroundColor',
    }

    override convertToWidget(): UE.Widget {
        const spinBox = new UE.SpinBox();
        this.commonPropertyInitialized(spinBox);

        for (const key in this.props) {
            if (this.valueConvertKeyMap[key]) {
                spinBox[this.valueConvertKeyMap[key]] = this.props[key];
            } else if (this.eventKeyMap[key] && typeof this.props[key] === 'function') {
                spinBox[this.eventKeyMap[key]].Add(this.props[key]);
            } else if (this.styleKeyMap[key]) {
                spinBox.WidgetStyle[this.styleKeyMap[key]] = parseBrush(this.props[key]);
            } else if (this.paddingKeyMap[key]) {
                spinBox.WidgetStyle[this.paddingKeyMap[key]] = convertMargin(this.props[key], {});
            } else if (this.colorKeyMap[key]) {
                const rgba = parseColor(this.props[key]);
                spinBox.WidgetStyle[this.colorKeyMap[key]] = new UE.LinearColor(rgba.r, rgba.g, rgba.b, rgba.a);
            } else if (key === 'textAlign') {
                switch (this.props[key]) {
                    case 'left':
                        spinBox.Justification = UE.ETextJustify.Left;
                        break;
                    case 'right':
                        spinBox.Justification = UE.ETextJustify.Right;
                        break;
                    case 'center':
                        spinBox.Justification = UE.ETextJustify.Center;
                        break;
                    default:
                        spinBox.Justification = UE.ETextJustify.Left;
                        break;
                }
            } else if (key === 'keyboardType') {
                switch (this.props[key]) {
                    case 'number':
                        spinBox.KeyboardType = UE.EVirtualKeyboardType.Number;
                        break;
                    case 'web':
                        spinBox.KeyboardType = UE.EVirtualKeyboardType.Web;
                        break;
                    case 'email':
                        spinBox.KeyboardType = UE.EVirtualKeyboardType.Email;
                        break;
                    case 'password':
                        spinBox.KeyboardType = UE.EVirtualKeyboardType.Password;
                        break;
                    case 'alpha-numberic':
                        spinBox.KeyboardType = UE.EVirtualKeyboardType.AlphaNumeric;
                        break;
                    default:
                        spinBox.KeyboardType = UE.EVirtualKeyboardType.Default;
                        break;
                }
            } else if (key === 'valueBinding') {
                spinBox.ValueDelegate.Bind(this.props[key]);
            }
        }

        UE.UMGManager.SynchronizeWidgetProperties(spinBox);

        return spinBox;
    }
    
    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        const spinBox = widget as UE.SpinBox;
        let propsChange = false;
        return propsChange;
    }
}
