import * as UE from 'ue';
import { ComponentWrapper } from './common_wrapper';

export class TextareaWrapper extends ComponentWrapper {
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

    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    override convertToWidget(): UE.Widget {
        const widget = new UE.MultiLineEditableText();

        // Apply properties
        for (const [key, setter] of Object.entries(this.propertySetters)) {
            if (key in this.props) {
                setter(widget, this.props[key]);
            }
        }

        // Setup event handlers
        for (const [key, handler] of Object.entries(this.eventHandlers)) {
            if (typeof this.props[key] === 'function') {
                this.eventCallbacks[key] = handler.setup(widget, this.props[key]);
            }
        }

        return widget;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        const multiLine = widget as UE.MultiLineEditableText;
        let hasChanges = false;

        // Update properties
        for (const [key, setter] of Object.entries(this.propertySetters)) {
            if (oldProps[key] !== newProps[key]) {
                setter(multiLine, newProps[key]);
                hasChanges = true;
            }
        }

        // Update event handlers
        for (const [key, handler] of Object.entries(this.eventHandlers)) {
            if (oldProps[key] !== newProps[key]) {
                if (this.eventCallbacks[key]) {
                    const eventDelegate = multiLine[handler.event];
                    if (eventDelegate && typeof eventDelegate.Remove === 'function') {
                        eventDelegate.Remove(this.eventCallbacks[key]);
                    }
                }
                if (typeof newProps[key] === 'function') {
                    this.eventCallbacks[key] = handler.setup(multiLine, newProps[key]);
                }
                hasChanges = true;
            }
        }

        return hasChanges;
    }
}