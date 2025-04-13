import * as UE from 'ue';
import { ComponentWrapper } from './common_wrapper';
import { parseBrush } from './parser/brush_parser';
import { parseColor } from './parser/color_parser';
import { convertMargin, parseBackgroundImage, parseBackgroundProps, parseBackgroundRepeat } from './common_utils';

export class ButtonWrapper extends ComponentWrapper {
    private useReactButton: boolean = true;
    private readonly eventCallbacks: Record<string, Function> = {
        onClick: undefined,
        onMouseDown: undefined, 
        onMouseUp: undefined,
        onMouseEnter: undefined,
        onMouseLeave: undefined,
        onFocus: undefined,
        onBlur: undefined
    };

    private readonly eventMappings: Record<string, {event: string, handler: string}> = {
        onClick: {event: 'OnClicked', handler: 'onClick'},
        onMouseDown: {event: 'OnPressed', handler: 'onMouseDown'},
        onMouseUp: {event: 'OnReleased', handler: 'onMouseUp'}, 
        onMouseEnter: {event: 'OnHovered', handler: 'onMouseEnter'},
        onMouseLeave: {event: 'OnUnhovered', handler: 'onMouseLeave'},
        onFocus: {event: 'OnHovered', handler: 'onFocus'},
        onBlur: {event: 'OnUnhovered', handler: 'onBlur'}
    };

    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;

        this.useReactButton = this.typeName === 'button';
    }

    private setupEventHandler(button: UE.Button, eventName: string, handler: Function) {
        if (typeof handler === 'function') {
            const mapping = this.eventMappings[eventName];
            this.eventCallbacks[mapping.handler] = handler;
            button[mapping.event].Add(handler);
        }
    }

    private removeEventHandler(button: UE.Button, eventName: string) {
        const mapping = this.eventMappings[eventName];
        const callback = this.eventCallbacks[mapping.handler];
        if (callback) {
            button[mapping.event].Remove(callback);
        }
    }

    private initReactButton(button: UE.Button) {
        // Setup all event handlers
        for (const eventName in this.eventMappings) {
            this.setupEventHandler(button, eventName, this.props[eventName]);
        }

        // Handle disabled state
        if (this.props?.disabled) {
            button.bIsEnabled = false;
        }

        // background 
        const buttonStyle = this.props?.style;
        if (buttonStyle) {
            const textColor = buttonStyle?.textColor;
            if (textColor) {
                const rgba = parseColor(textColor);
                button.ColorAndOpacity.R = rgba.r;
                button.ColorAndOpacity.G = rgba.g;
                button.ColorAndOpacity.B = rgba.b;
                button.ColorAndOpacity.A = rgba.a;
            }

            const background = buttonStyle?.background;
            if (background) {
                const result = parseBackgroundProps(background);
                if (result?.image) {
                    button.WidgetStyle.Normal = result.image;
                }

                if (result?.color) {
                    const rgba = parseColor(result.color);
                    button.BackgroundColor.R = rgba.r;
                    button.BackgroundColor.G = rgba.g;
                    button.BackgroundColor.B = rgba.b;
                    button.BackgroundColor.A = rgba.a;
                }
            }

            const backgroundImage = buttonStyle?.backgroundImage;
            let hasBackgroundImage = false;
            if (backgroundImage) {
                button.WidgetStyle.Normal = parseBackgroundImage(backgroundImage, buttonStyle?.backgroundSize);
                hasBackgroundImage = true;
            }
            
            const backgroundColor = buttonStyle?.backgroundColor;
            if (backgroundColor) {
                const rgba = parseColor(backgroundColor);
                button.BackgroundColor.R = rgba.r;
                button.BackgroundColor.G = rgba.g;
                button.BackgroundColor.B = rgba.b;
                button.BackgroundColor.A = rgba.a;
            }

            const backgroundRepeat = buttonStyle?.backgroundRepeat;
            if (backgroundRepeat && hasBackgroundImage) {
                button.WidgetStyle.Normal = parseBackgroundRepeat(backgroundRepeat, button.WidgetStyle.Normal);
            }

            const padding = buttonStyle?.padding;
            if (padding) {
                button.WidgetStyle.NormalPadding = convertMargin(padding, buttonStyle);
            }
        }
    }

    private initNativeButton(button: UE.Button) {
        const brushKeyMap: Record<string, string> = {
            'background': 'Normal',
            'hoveredBackground': 'Hovered',
            'pressedBackground': 'Pressed',
            'disabledBackground': 'Disabled'
        };
        
        const colorKeyMap: Record<string, string> = {
            'textColor': 'ColorAndOpacity',
            'backgroundColor': 'BackgroundColor'
        };

        const paddingKeyMap: Record<string, string> = {
            'normalPadding': 'NormalPadding',
            'pressedPadding': 'PressedPadding',
        };

        const soundKeyMap: Record<string, string> = {
            'pressedSound': 'PressedSlateSound',
            'hoveredSound': 'HoveredSlateSound',
        };
        
        const eventKeyMap: Record<string, string> = {
            'onClick': 'OnClicked',
            'onPressed': 'OnPressed',
            'onReleased': 'OnReleased',
            'onHovered': 'OnHovered',
            'onUnhovered': 'OnUnhovered',
        };
        
        for (const key in this.props) {
            const value = this.props[key];
            if (brushKeyMap[key]) {
                button.WidgetStyle[brushKeyMap[key]] = parseBrush(value);
            } else if (colorKeyMap[key]) {
                const rgba = parseColor(value);
                button[colorKeyMap[key]].R = rgba.r;
                button[colorKeyMap[key]].G = rgba.g;
                button[colorKeyMap[key]].B = rgba.b;
                button[colorKeyMap[key]].A = rgba.a;

            } else if (paddingKeyMap[key]) {
                button[paddingKeyMap[key]] = convertMargin(value, {});
            } else if (soundKeyMap[key]) {
                // todo@Caleb196x: 添加sound
            } else if (eventKeyMap[key]) {
                button[eventKeyMap[key]].Add(value);
            } else if (key === 'focusable') {
                button.IsFocusable = value;
            }
        }
    }

    override convertToWidget(): UE.Widget {
        const button = new UE.Button();
        if (this.useReactButton) {
            this.initReactButton(button);
        } else {
            this.initNativeButton(button);
        }

        this.commonPropertyInitialized(button);

        UE.UMGManager.SynchronizeWidgetProperties(button);

        return button;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        let propsChange = false;
        const button = widget as UE.Button;

        for (const key in newProps) {
            const oldProp = oldProps[key];
            const newProp = newProps[key];

            if (oldProp === newProp) continue;

            propsChange = true;

            if (key in this.eventMappings) {
                if (typeof newProp === 'function') {
                    this.removeEventHandler(button, key);
                    this.setupEventHandler(button, key, newProp);
                }
            } else if (key === 'disabled') {
                button.bIsEnabled = !newProp;
            }
        }

        this.commonPropertyInitialized(widget);
        UE.UMGManager.SynchronizeWidgetProperties(button);
        return propsChange;
    }

    override convertReactEventToWidgetEvent(reactProp: string, originCallback: Function): Function {
        return undefined;
    }
}