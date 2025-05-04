import * as UE from 'ue';
import { JSXConverter } from './jsx_converter';

export class TextAreaConverter extends JSXConverter {
    constructor(typeName: string, props: any) {
        super(typeName, props);
    }

    private readonly propertySetters: Record<string, (widget: UE.MultiLineEditableText, value: any) => void> = {
        'value': (widget, value) => value && widget.SetText(value),
        'defaultValue': (widget, value) => value && widget.SetText(value), 
        'placeholder': (widget, value) => value && widget.SetHintText(value),
        'readOnly': (widget, value) => value && widget.SetIsReadOnly(value),
        'disabled': (widget, value) => value && widget.SetIsEnabled(!value)
    };

    
    private readonly eventHandlers: Record<string, {
        event: string,
        setup: (widget: UE.MultiLineEditableText, handler: Function) => Function
    }> = {
        'onChange': {
            event: 'OnTextChanged',
            setup: (widget, handler) => {
                const callback = (text: string) => handler({target: {value: text}});
                widget.OnTextChanged.Add(callback);
                return callback;
            }
        },
        'onSubmit': {
            event: 'OnTextCommitted', 
            setup: (widget, handler) => {
                const callback = (text: string, commitMethod: UE.ETextCommit) => {
                    if (commitMethod === UE.ETextCommit.Default) {
                        handler({target: text});
                    }
                };
                widget.OnTextCommitted.Add(callback);
                return callback;
            }
        },
        'onBlur': {
            event: 'OnTextCommitted',
            setup: (widget, handler) => {
                const callback = (text: string, commitMethod: UE.ETextCommit) => {
                    if (commitMethod === UE.ETextCommit.OnUserMovedFocus) {
                        handler({target: {value: text}});
                    }
                };
                widget.OnTextCommitted.Add(callback);
                return callback;
            }
        }
    };

    private eventCallbacks: Record<string, Function> = {};

    private initTextAreaProps(textArea: UE.MultiLineEditableText, props: any): boolean {
        let propsInit = false;
        // Apply properties
        for (const [key, setter] of Object.entries(this.propertySetters)) {
            if (key in props) {
                setter(textArea, props[key]);
                propsInit = true;
            }
        }

        // Setup event handlers
        for (const [key, handler] of Object.entries(this.eventHandlers)) {
            if (this.eventCallbacks[key]) {
                const eventDelegate = textArea[handler.event];
                if (eventDelegate && typeof eventDelegate.Remove === 'function') {
                    eventDelegate.Remove(this.eventCallbacks[key]);
                }
            }

            if (typeof props[key] === 'function') {
                this.eventCallbacks[key] = handler.setup(textArea, props[key]);
                propsInit = true;
            }
        }

        return propsInit;
    }

    createNativeWidget(): UE.Widget {
        const textArea = new UE.MultiLineEditableText();
        const propsInit = this.initTextAreaProps(textArea, this.props);
        if (propsInit) {
            UE.UMGManager.SynchronizeWidgetProperties(textArea);
        }
        return textArea;
    }

    update(widget: UE.Widget, oldProps: any, changedProps: any): void {
        const textArea = widget as UE.MultiLineEditableText;
        const propsChanged = this.initTextAreaProps(textArea, changedProps);
        if (propsChanged) {
            UE.UMGManager.SynchronizeWidgetProperties(textArea);
        }
    }
}
