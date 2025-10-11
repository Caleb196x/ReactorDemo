import * as UE from 'ue';
import { JSXConverter } from './jsx_converter';
import { getAllStyles } from '../parsers/cssstyle_parser';
import { hasFontStyles, setupFontStyles } from '../parsers/css_font_parser';

export class InputJSXConverter extends JSXConverter {
    private isCheckbox: boolean;
    private checkboxChangeCallback: (isChecked: boolean) => void;
    private textChangeCallback: (text: string) => void;

    constructor(typeName: string, props: any, outer: any) {
        super(typeName, props, outer);
        this.isCheckbox = false;
    }

    private handleTextChange(widget: UE.EditableText, onChange: Function) {
        if (this.textChangeCallback) {
            widget.OnTextChanged.Remove(this.textChangeCallback);
        }
        this.textChangeCallback = (text: string) => onChange({target: {name: this.props.name, type: this.props.type, value: text}});
        widget.OnTextChanged.Add(this.textChangeCallback);
    }

    private handleCheckboxChange(widget: UE.CheckBox, onChange: Function) {
        if (this.checkboxChangeCallback) {
            widget.OnCheckStateChanged.Remove(this.checkboxChangeCallback);
        }
        this.checkboxChangeCallback = (isChecked: boolean) => onChange({target: {checked: isChecked}});
        widget.OnCheckStateChanged.Add(this.checkboxChangeCallback);
    }

    private setupCheckbox(widget: UE.CheckBox, props: any) {
        const { checked, onChange } = props;
        
        if (checked) widget.SetIsChecked(true);
        if (typeof onChange === 'function') this.handleCheckboxChange(widget, onChange);
        // set checkbox style
        // umg checkbox to more styles
    }

    private setupEditableText(widget: UE.EditableText, props: any) {
        const { placeholder, defaultValue, disabled, readOnly, onChange } = props;
        
        if (placeholder) widget.SetHintText(placeholder);
        if (defaultValue) widget.SetText(defaultValue);
        if (disabled) widget.SetIsEnabled(false);
        if (readOnly) widget.SetIsReadOnly(true);
        if (typeof onChange === 'function') this.handleTextChange(widget, onChange);
        
        // set editable text style for font, color, etc.
        const styles = getAllStyles(this.typeName, props);
        if (hasFontStyles(styles)) {
            if (!widget.WidgetStyle || !widget.WidgetStyle.Font) {
                const fontStyles = new UE.SlateFontInfo();
                setupFontStyles(widget, fontStyles, styles);
                widget.SetFont(fontStyles);
            } else {
                setupFontStyles(widget, widget.WidgetStyle.Font, styles);
            }
        }
    }

    createNativeWidget(): UE.Widget {
        const inputType = this.props?.type || 'text';
        let widget: UE.Widget;

        if (inputType === 'checkbox') {
            widget = new UE.CheckBox(this.outer);
            this.setupCheckbox(widget as UE.CheckBox, this.props);
            this.isCheckbox = true;
        } else {
            widget = new UE.EditableText(this.outer);
            if (inputType === 'password') {
                (widget as UE.EditableText).SetIsPassword(true);
            }
            this.setupEditableText(widget as UE.EditableText, this.props);
        }
        
        return widget;
    }

    update(widget: UE.Widget, oldProps: any, changedProps: any): void {
        if (this.isCheckbox) {
            this.setupCheckbox(widget as UE.CheckBox, changedProps);
        } else {
            this.setupEditableText(widget as UE.EditableText, changedProps);
        }
    }
}