import { ComponentWrapper } from './common_wrapper';
import * as UE from 'ue';
import { parseBrush } from './parser/brush_parser';
import { convertMargin } from './common_utils';
import { parseColor } from './parser/color_parser';

export class CheckboxWrapper extends ComponentWrapper {
    constructor(type: string, props: any) {
        super();
        this.props = props;
        this.typeName = type;
    }

    private setupCheckboxStyle(checkbox: UE.CheckBox) {
        const checkboxStyle = this.props?.checkboxStyle;
        if (!checkboxStyle) {
            return;
        }
        
        const imageStyleMap: Record<string, string> = {
            'uncheckedBackground': 'UncheckedImage',
            'uncheckedHoveredBackground': 'UncheckedHoveredImage',
            'uncheckedPressedBackground': 'UncheckedPressedImage',
            'checkedBackground': 'CheckedImage',
            'checkedHoveredBackground': 'CheckedHoveredImage',
            'checkedPressedBackground': 'CheckedPressedImage',
            'undeterminedBackground': 'UndeterminedImage',
            'undeterminedHoveredBackground': 'UndeterminedHoveredImage',
            'undeterminedPressedBackground': 'UndeterminedPressedBrush',
            'normalBackground': 'BackgroundImage',
            'normalHoveredBackground': 'BackgroundHoveredImage',
            'normalPressedBackground': 'BackgroundPressedImage',
        }

        const soundMap: Record<string, string> = {
            'checkSound': 'CheckedSlateSound',
            'uncheckSound': 'UncheckedSlateSound',
            'hoveredSound': 'HoveredSlateSound',
        }

        for (const [key, value] of Object.entries(checkboxStyle)) {
            if (imageStyleMap[key]) {
                checkbox.WidgetStyle[imageStyleMap[key]] = parseBrush(value);
            } else if (soundMap[key]) {
                // todo@Caleb196x: 需要解析sound
                checkbox.WidgetStyle[soundMap[key]] = {};
            } else if (key === 'padding') {
                checkbox.WidgetStyle.Padding = convertMargin(value as string, checkboxStyle);
            } else if (key === 'color') {
                const rgba = parseColor(value as string);
                checkbox.WidgetStyle.ForegroundColor.SpecifiedColor.R = rgba.r;
                checkbox.WidgetStyle.ForegroundColor.SpecifiedColor.G = rgba.g;
                checkbox.WidgetStyle.ForegroundColor.SpecifiedColor.B = rgba.b;
                checkbox.WidgetStyle.ForegroundColor.SpecifiedColor.A = rgba.a;
            } else if (key === 'type') {
                switch (value) {
                    case 'checkbox':
                        checkbox.WidgetStyle.CheckBoxType = UE.ESlateCheckBoxType.CheckBox;
                        break;
                    case 'toggle':
                        checkbox.WidgetStyle.CheckBoxType = UE.ESlateCheckBoxType.ToggleButton;
                        break;
                    case 'default':
                    default:
                        checkbox.WidgetStyle.CheckBoxType = UE.ESlateCheckBoxType.CheckBox;
                        break;
                }
            }
        }
        
    }

    override convertToWidget(): UE.Widget {
        const checkbox = new UE.CheckBox();
        this.commonPropertyInitialized(checkbox);
        this.setupCheckboxStyle(checkbox);

        const checked = this.props?.checked;
        if (checked) {
            checkbox.SetIsChecked(checked);
        }

        const stateBinding = this.props?.checkStateBinding;
        if (stateBinding && typeof stateBinding === 'function') {
            checkbox.CheckedStateDelegate.Bind(stateBinding);
        }

        UE.UMGManager.SynchronizeWidgetProperties(checkbox);
        return checkbox;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        return true;
    }
}
