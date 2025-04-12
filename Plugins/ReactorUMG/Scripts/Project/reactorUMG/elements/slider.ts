import * as UE from 'ue';
import { ComponentWrapper } from "./common_wrapper";
import { parseColor } from './parser/color_parser';
import { parseBrush } from './parser/brush_parser';

export function setupSliderCommonProps(slider: UE.Slider | UE.RadialSlider, props: any) {
    if (!props || !slider) return;

    const valueConvertKeyMap: Record<string, string> = {
        'value': 'Value',
        'stepSize': 'StepSize',
        'locked': 'Locked',
        'useMouseStep': 'MouseUsesStep',
        'controllerLock': 'RequiresControllerLock',
        'focusable': 'IsFocusable'
    }

    const colorKeyMap: Record<string, string> = {
        'sliderBarColor': 'SliderBarColor',
        'sliderThumbColor': 'SliderHandleColor',
    }

    const styleKeyMap: Record<string, string> = {
        'normalBarBackground': 'NormalBarImage',
        'hoverBarBackground': 'HoveredBarImage',
        'disabledBarBackground': 'DisabledBarImage',
        'normalThumbBackground': 'NormalThumbImage',
        'hoveredThumbBackground': 'HoveredThumbImage',
        'disabledThumbBackground': 'DisabledThumbImage'
    }

    const eventKeyMap: Record<string, string> = {
        'onValueChanged': 'OnValueChanged',
        'onMouseCaptureBegin': 'OnMouseCaptureBegin',
        'onMouseCaptureEnd': 'OnMouseCaptureEnd',
        'onControllerCaptureBegin': 'OnControllerCaptureBegin',
        'onControllerCaptureEnd': 'OnControllerCaptureEnd',
    }

    for (const key in this.props) {
        if (valueConvertKeyMap[key]) {
            slider[valueConvertKeyMap[key]] = props[key];
        } else if (colorKeyMap[key]) {
            const color = parseColor(props[key]);
            slider[colorKeyMap[key]] = new UE.LinearColor(color.r, color.g, color.b, color.a);
        } else if (styleKeyMap[key]) {
            slider.WidgetStyle[styleKeyMap[key]] = parseBrush(props[key]);
        } else if (key === 'barThickness') {
            slider.WidgetStyle.BarThickness = props[key];
        }

        if (typeof this.props[key] === 'function') {
            if (eventKeyMap[key]) {
                slider[eventKeyMap[key]].Add(props[key]);
            } else if (key === 'valueBinding') {
                slider.ValueDelegate.Bind(props[key]);
            }
        }
    }
}

export class SliderWrapper extends ComponentWrapper {
    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    override convertToWidget(): UE.Widget {
        const slider = new UE.Slider();
        this.commonPropertyInitialized(slider);
        setupSliderCommonProps(slider, this.props);

        const minValue = this.props?.minValue;
        if (minValue) {
            slider.MinValue = minValue;
        }

        const maxValue = this.props?.maxValue;
        if (maxValue) {
            slider.MaxValue = maxValue;
        }

        const indentHandle = this.props?.indentHandle;
        if (indentHandle) {
            slider.IndentHandle = indentHandle;
        }

        const orientation = this.props?.orientation;
        if (orientation) {
            switch (orientation) {
                case 'horizontal':
                    slider.Orientation = UE.EOrientation.Orient_Horizontal;
                    break;
                case 'vertical':
                    slider.Orientation = UE.EOrientation.Orient_Vertical;
                    break;
                default:
                    slider.Orientation = UE.EOrientation.Orient_Horizontal;
                    break;
            }
        }

        UE.UMGManager.SynchronizeWidgetProperties(slider);

        return slider;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        const slider = widget as UE.Slider;
        let propsChange = false;
        return propsChange;
    }
}

