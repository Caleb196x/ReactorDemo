import * as UE from 'ue';
import { ComponentWrapper } from './common_wrapper';

export class InputWrapper extends ComponentWrapper {
    private textChangeCallback: (text: string) => void;
    private checkboxChangeCallback: (isChecked: boolean) => void;

    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    private handleTextChange(widget: UE.EditableText, onChange: Function) {
        if (this.textChangeCallback) {
            widget.OnTextChanged.Remove(this.textChangeCallback);
        }
        this.textChangeCallback = (text: string) => onChange({target: {value: text}});
        widget.OnTextChanged.Add(this.textChangeCallback);
    }

    private handleCheckboxChange(widget: UE.CheckBox, onChange: Function) {
        if (this.checkboxChangeCallback) {
            widget.OnCheckStateChanged.Remove(this.checkboxChangeCallback);
        }
        this.checkboxChangeCallback = (isChecked: boolean) => onChange({target: {checked: isChecked}});
        widget.OnCheckStateChanged.Add(this.checkboxChangeCallback);
    }

    private setupTextInput(widget: UE.EditableText, props: any) {
        const { placeholder, defaultValue, disabled, readOnly, onChange } = props;
        
        if (placeholder) widget.SetHintText(placeholder);
        if (defaultValue) widget.SetText(defaultValue);
        if (disabled) widget.SetIsEnabled(false);
        if (readOnly) widget.SetIsReadOnly(true);
        if (typeof onChange === 'function') this.handleTextChange(widget, onChange);
    }

    private setupCheckbox(widget: UE.CheckBox, props: any) {
        const { checked, onChange } = props;
        
        if (checked) widget.SetIsChecked(true);
        if (typeof onChange === 'function') this.handleCheckboxChange(widget, onChange);
    }

    override convertToWidget(): UE.Widget {
        const inputType = this.props.type || 'text';
        let widget: UE.Widget;

        if (inputType === 'checkbox') {
            widget = new UE.CheckBox();
            this.setupCheckbox(widget as UE.CheckBox, this.props);
        } else {
            widget = new UE.EditableText();
            if (inputType === 'password') {
                (widget as UE.EditableText).SetIsPassword(true);
            }
            this.setupTextInput(widget as UE.EditableText, this.props);
        }

        this.commonPropertyInitialized(widget);
        return widget;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        if (oldProps.type !== newProps.type) {
            console.error('Cannot change input type');
            return false;
        }

        const type = newProps.type || 'text';
        let changed = false;

        if (type === 'checkbox' && widget instanceof UE.CheckBox) {
            if (oldProps.checked !== newProps.checked || oldProps.onChange !== newProps.onChange) {
                this.setupCheckbox(widget, newProps);
                changed = true;
            }
        } else if (widget instanceof UE.EditableText) {
            const props = ['placeholder', 'defaultValue', 'disabled', 'readOnly', 'onChange'];
            for (const prop of props) {
                if (oldProps[prop] !== newProps[prop]) {
                    this.setupTextInput(widget, newProps);
                    changed = true;
                    break;
                }
            }
        }

        if (changed) {
            this.commonPropertyInitialized(widget);
        }
        return changed;
    }

    override convertReactEventToWidgetEvent(reactProp: string, originCallback: Function): Function {
        return undefined;
    }
}