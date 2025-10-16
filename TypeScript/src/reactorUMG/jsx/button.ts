import * as UE from "ue";
import { parseToLinearColor } from "../parsers/css_color_parser";
import { getAllStyles } from "../parsers/cssstyle_parser";
import { JSXConverter } from "./jsx_converter";
import { parseBackgroundProps } from "../parsers/css_background_parser";

export class ButtonConverter extends JSXConverter {

    private readonly eventCallbacks: Record<string, Function> = {
        onClick: undefined,
        onMouseDown: undefined, 
        onMouseUp: undefined,
        onMouseEnter: undefined,
        onMouseLeave: undefined,
        onFocus: undefined,
        onBlur: undefined
    };

    private readonly eventNameMapping: Record<string, {event: string, handler: string}> = {
        onClick: {event: 'OnClicked', handler: 'onClick'},
        onMouseDown: {event: 'OnPressed', handler: 'onMouseDown'},
        onMouseUp: {event: 'OnReleased', handler: 'onMouseUp'}, 
        onMouseEnter: {event: 'OnHovered', handler: 'onMouseEnter'},
        onMouseLeave: {event: 'OnUnhovered', handler: 'onMouseLeave'},
        onFocus: {event: 'OnHovered', handler: 'onFocus'},
        onBlur: {event: 'OnUnhovered', handler: 'onBlur'}
    };

    constructor(typeName: string, props: any, outer: any) {
        super(typeName, props, outer);
    }

    private setButtonTextColor(button: UE.Button, style: any) {
        const textColor = style?.textColor || style?.color;
        if (!textColor) {
            return;
        }

        const rgba = parseToLinearColor(textColor);

        if (button.ColorAndOpacity) {
            button.ColorAndOpacity.R = rgba.r;
            button.ColorAndOpacity.G = rgba.g;
            button.ColorAndOpacity.B = rgba.b;
            button.ColorAndOpacity.A = rgba.a;
        } else {
            button.ColorAndOpacity = new UE.LinearColor(rgba.r, rgba.g, rgba.b, rgba.a);
        }
    }

    private setButtonBackgroundStyles(button: UE.Button, style: any) {
        
        const parsedBackground = parseBackgroundProps(style);
        if (parsedBackground?.image) {
            button.WidgetStyle.Normal = parsedBackground.image;
        }

        if (parsedBackground?.color) {
            button.BackgroundColor = parsedBackground?.color
        }

        // todo@Caleb196x: 处理hover, pressed, disabled状态的背景
    }

    private setButtonStyles(button: UE.Button, props?: any) {
        let buttonStyle = this.widgetStyle;
        if (props) {
            buttonStyle = getAllStyles(this.typeName, props);
        }
        if (!button) {
            return;
        }

        if (props?.disabled) {
            button.bIsEnabled = false;
        } else {
            button.bIsEnabled = true;
        }

        this.setButtonTextColor(button, buttonStyle);
        this.setButtonBackgroundStyles(button, buttonStyle);
    }

    private initSingleEventHandler(button: UE.Button, eventName: string, handler: Function) {
        if (!handler || typeof handler !== 'function') {
            return;
        }

        const mapping = this.eventNameMapping[eventName];
        if (!mapping) {
            console.warn(`Event Name from predefined map not found for event: ${eventName}`);
            return;
        }

        this.eventCallbacks[mapping.handler] = handler;
        button[mapping.event].Add(handler);
    }

    private removeSingleEventHandler(button: UE.Button, eventName: string) {
        const mapping = this.eventNameMapping[eventName];
        if (!mapping) {
            return;
        }

        const callback = this.eventCallbacks[mapping.handler];
        if (callback) {
            button[mapping.event].Remove(callback);
        }
    }

    private setButtonEventHandlers(button: UE.Button, props?: any) {
        if (!props) {
            return;
        }

        // Setup all event handlers
        for (const eventName in this.eventNameMapping) {
            this.initSingleEventHandler(button, eventName, props[eventName]);
        }
    }

    private setupButtonProps(button: UE.Button, props?: any) {
        this.setButtonStyles(button);
        this.setButtonEventHandlers(button, props);
        UE.UMGManager.SynchronizeWidgetProperties(button);
    }

    createNativeWidget() {
        const button = new UE.Button(this.outer);
        this.setupButtonProps(button, this.props);
        return button;
    }

    update(widget: UE.Widget, oldProps: any, changedProps: any) {
        const button = widget as UE.Button;
        this.setButtonStyles(button, changedProps);
        
        for (const name in this.eventNameMapping) {
            if (changedProps[name] && typeof changedProps[name] === 'function') { 
                this.removeSingleEventHandler(button, name);
                this.initSingleEventHandler(button, name, changedProps[name]);
            }
        }

        UE.UMGManager.SynchronizeWidgetProperties(button);
    }
}
