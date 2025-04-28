import * as UE from "ue";
import { parseColor } from "../parsers/css_color_parser";
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

    constructor(typeName: string, props: any) {
        super(typeName, props);
    }

    private setButtonTextColor(button: UE.Button, style: any) {
        const textColor = style?.textColor;
        if (!textColor) {
            return;
        }

        const rgba = parseColor(textColor);

        if (button.ColorAndOpacity) {
            button.ColorAndOpacity.R = rgba.r;
            button.ColorAndOpacity.G = rgba.g;
            button.ColorAndOpacity.B = rgba.b;
            button.ColorAndOpacity.A = rgba.a;
        } else {
            button.ColorAndOpacity = new UE.LinearColor(rgba.r, rgba.g, rgba.b, rgba.a);
        }
    }

    private setButtonBackground(button: UE.Button, style: any) {
        const background = style?.background;
        if (!background) {
            return;
        }
        
        const parsedBackground = parseBackgroundProps(background);
        if (parsedBackground?.image) {
            button.WidgetStyle.Normal = parsedBackground.image;
        }

        if (parsedBackground?.color) {
            const rgba = parseColor(parsedBackground.color);

            if (button.BackgroundColor) {
                button.BackgroundColor.R = rgba.r;
                button.BackgroundColor.G = rgba.g;
                button.BackgroundColor.B = rgba.b;
                button.BackgroundColor.A = rgba.a;
            } else {
                button.BackgroundColor = new UE.LinearColor(rgba.r, rgba.g, rgba.b, rgba.a);    
            }
        }

        // todo@Caleb196x: 处理hover, pressed, disabled状态的背景
    }

    private setButtonStyle(button: UE.Button, props?: any) {
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
        this.setButtonBackground(button, buttonStyle);
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
        this.setButtonStyle(button);
        this.setButtonEventHandlers(button, props);
        UE.UMGManager.SynchronizeWidgetProperties(button);
    }

    createNativeWidget() {
        const button = new UE.Button();
        this.setupButtonProps(button);
        return button;
    }

    update(widget: UE.Widget, oldProps: any, changedProps: any) {
        const button = widget as UE.Button;
        this.setButtonStyle(button, changedProps);
        
        for (const name in this.eventNameMapping) {
            if (changedProps[name] && typeof changedProps[name] === 'function') { 
                this.removeSingleEventHandler(button, name);
                this.initSingleEventHandler(button, name, changedProps[name]);
            }
        }

        UE.UMGManager.SynchronizeWidgetProperties(button);
    }
}
