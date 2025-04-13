import { ComponentWrapper } from './common_wrapper';
import * as UE from 'ue';
import { parseBrush } from './parser/brush_parser';
import { convertMargin } from './common_utils';
import { parseColor } from './parser/color_parser';

export class ComboBoxWrapper extends ComponentWrapper {
    constructor(type: string, props: any) {
        super();
        this.props = props;
        this.typeName = type;
    }

    private setupOptions(comboBox: UE.ComboBoxString) {
        const options = this.props?.options;
        if (options) {
            comboBox.ClearOptions();
            options.forEach((option: string) => {
                comboBox.DefaultOptions.Add(option);
                comboBox.AddOption(option);
            });
        }

        const selectedOption = this.props?.selectedOption;
        if (selectedOption) {
            comboBox.SetSelectedOption(selectedOption);
        }
    }

    private setupComboBoxStyle(comboBox: UE.ComboBoxString) {
        const comboBoxStyle = this.props?.comboBoxStyle;
        if (!comboBoxStyle) {
            return;
        }

        const styleMap: Record<string, string> = {
            'backgroundImage': 'Normal',
            'hoveredBackgroundImage': 'Hovered',
            'pressedBackgroundImage': 'Pressed',
            'disabledBackgroundImage': 'Disabled',
            'downArrowBackground': 'DownArrow',
        }

        const soundMap: Record<string, string> = {
            'pressedSound': 'PressedSlateSound',
            'selectionChangeSound': 'SelectionChangeSlateSound',
        }

        const paddingMap: Record<string, string> = {
            'rowPadding': 'MenuRowPadding',
            'downArrowPadding': 'DownArrowPadding',
        }

        for (const [key, value] of Object.entries(comboBoxStyle)) {
            if (styleMap[key]) {
                comboBox.WidgetStyle.ComboButtonStyle.ButtonStyle[styleMap[key]] = parseBrush(value);
            } else if (soundMap[key]) {
                // todo@Caleb196x: 需要解析sound
                comboBox.WidgetStyle[soundMap[key]] = {};
            } else if (paddingMap[key]) {
                comboBox.WidgetStyle[paddingMap[key]] = convertMargin(value as string, comboBoxStyle);
            } else if (key === 'downArrowBackground') {
                comboBox.WidgetStyle.ComboButtonStyle.DownArrowImage = parseBrush(value);
            } else if (key === 'downArrowPadding') {
                comboBox.WidgetStyle.ComboButtonStyle.DownArrowPadding = convertMargin(value as string, comboBoxStyle);
            } else if (key === 'downArrowAlign') {
                switch (value) {
                    case 'left':
                    case 'top':
                        comboBox.WidgetStyle.ComboButtonStyle.DownArrowAlign = UE.EVerticalAlignment.VAlign_Top;
                        break;
                    case 'right':
                    case 'bottom':
                        comboBox.WidgetStyle.ComboButtonStyle.DownArrowAlign = UE.EVerticalAlignment.VAlign_Bottom;
                        break;
                    case 'center':
                        comboBox.WidgetStyle.ComboButtonStyle.DownArrowAlign = UE.EVerticalAlignment.VAlign_Center;
                        break;
                    default:
                        comboBox.WidgetStyle.ComboButtonStyle.DownArrowAlign = UE.EVerticalAlignment.VAlign_Top;
                        break;
                }
            }
        }
    }

    private setupComboBoxScrollBarStyle(comboBox: UE.ComboBoxString) {
        const comboBoxScrollBarStyle = this.props?.comboBoxScrollBarStyle;
        if (!comboBoxScrollBarStyle) {
            return;
        }

        const styleMap: Record<string, string> = {
            'horizontalBackground': 'HorizontalBackgroundImage',
            'verticalBackground': 'VerticalBackgroundImage',
            'normalThumb': 'NormalThumbImage',
            'hoveredThumb': 'HoveredThumbImage',
            'draggedThumb': 'DraggedThumbImage',
        }
        
        for (const [key, value] of Object.entries(comboBoxScrollBarStyle)) {
            if (styleMap[key]) {
                comboBox.ScrollBarStyle[styleMap[key]] = parseBrush(value);
            } else if (key === 'thickness') {
                comboBox.ScrollBarStyle.Thickness = value as number;
            }
        }
    }

    private setupComboBoxItemStyle(comboBox: UE.ComboBoxString) {
        const comboBoxItemStyle = this.props?.comboBoxItemStyle;
        if (!comboBoxItemStyle) {
            return;
        }

        const styleMap: Record<string, string> = {
            'activeBackground': 'ActiveBrush',
            'activeHoveredBackground': 'ActiveHoveredBrush',
            'focusedBackground': 'SelectorFocusedBrush',
            'inactiveBackground': 'InactiveBrush',
            'inactiveHoveredBackground': 'InactiveHoveredBrush',
            'menuRowBackground': 'MenuRowBrush',
            'evenMenuRowBackground': 'EvenMenuRowBrush',
            'oddMenuRowBackground': 'OddMenuRowBrush',
        }

        const colorMap: Record<string, string> = {
            'textColor': 'TextColor',
            'selectedTextColor': 'SelectedTextColor',
        }

        for (const [key, value] of Object.entries(comboBoxItemStyle)) {
            if (styleMap[key]) {
                // fixme@Caleb196x: 需要处理styleMap[key]不存在的情况
                comboBox.ItemStyle[styleMap[key]] = parseBrush(value);
            } else if (colorMap[key]) {
                const rgba = parseColor(value as string);
                comboBox.ItemStyle[colorMap[key]].SpecifiedColor.R = rgba.r;
                comboBox.ItemStyle[colorMap[key]].SpecifiedColor.G = rgba.g;
                comboBox.ItemStyle[colorMap[key]].SpecifiedColor.B = rgba.b;
                comboBox.ItemStyle[colorMap[key]].SpecifiedColor.A = rgba.a;
            }
        }
    }

    override convertToWidget(): UE.Widget {
        const comboBox = new UE.ComboBoxString();
        this.commonPropertyInitialized(comboBox);

        this.setupOptions(comboBox);
        this.setupComboBoxStyle(comboBox);
        this.setupComboBoxItemStyle(comboBox);
        this.setupComboBoxScrollBarStyle(comboBox);

        const valueMap: Record<string, string> = {
            'maxListHeight': 'MaxListHeight',
            'hasDownArrow': 'HasDownArrow',
            'enableGamepadNavigation': 'EnableGamepadNavigation',
        }

        const eventMap: Record<string, string> = {
            'onOpened': 'OnOpened',
            'onSelectionChanged': 'OnSelectionChanged',
        }

        for (const [key, value] of Object.entries(valueMap)) {
            if (valueMap[key]) {
                comboBox[valueMap[key]] = value;
            } else if (eventMap[key]) {
                comboBox[eventMap[key]].Add(value);
            } else if (key === 'contentPadding') {
                comboBox.ContentPadding = convertMargin(value as string, this.props?.style);
            }
        }

        UE.UMGManager.SynchronizeWidgetProperties(comboBox);

        return comboBox;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        return false;
    }
    
}
