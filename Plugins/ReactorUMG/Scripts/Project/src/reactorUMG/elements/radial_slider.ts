import { ComponentWrapper } from './common_wrapper';
import * as UE from 'ue';
import { parseColor } from './parser/color_parser';
import { parseBrush } from './parser/brush_parser';
import { setupSliderCommonProps } from './slider';

export class RadialSliderWrapper extends ComponentWrapper {
    private valueConvertKeyMap: Record<string, string> = {
        'defaultValue': 'CustomDefaultValue',
        'thumbStartAngle': 'SliderHandleStartAngle',
        'thumbEndPointAngle': 'SliderHandleEndAngle',
        'thumbAngularOffset': 'AngularOffset',
        'showSliderThumb': 'ShowSliderHandle',
        'showSliderHand': 'ShowSliderHand'
    }

    private colorKeyMap: Record<string, string> = {
        'sliderProgressColor': 'SliderProgressColor',
        'backgroundColor': 'CenterBackgroundColor',
    }

    constructor(type: string, props: any) {
        super();
        this.props = props;
        this.typeName = type;
    }

    override convertToWidget(): UE.Widget {
        const radialSlider = new UE.RadialSlider();
        this.commonPropertyInitialized(radialSlider);
        setupSliderCommonProps(radialSlider, this.props);

        for (const key in this.props) {
            if (this.valueConvertKeyMap[key]) {
                radialSlider[this.valueConvertKeyMap[key]] = this.props[key];
            } else if (this.colorKeyMap[key]) {
                const color = parseColor(this.props[key]);
                radialSlider[this.colorKeyMap[key]] = new UE.LinearColor(color.r, color.g, color.b, color.a);
            } else if (key === 'valueTags') {
                this.props[key].map((tag: number) => radialSlider.ValueTags.Add(tag));
            }
        }

        UE.UMGManager.SynchronizeWidgetProperties(radialSlider);
        return radialSlider;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        const radialSlider = widget as UE.RadialSlider;
        let propsChange = false;
        return propsChange;
    }
}
