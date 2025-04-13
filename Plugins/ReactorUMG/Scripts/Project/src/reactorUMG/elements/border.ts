import * as UE from 'ue';
import { ComponentWrapper } from "./common_wrapper";
import { parseColor } from './parser/color_parser';
import { parseBrush } from './parser/brush_parser';
import { convertMargin } from './common_utils';

export class BorderWrapper extends ComponentWrapper {

    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    override convertToWidget(): UE.Widget {
        const border = new UE.Border();
        this.commonPropertyInitialized(border);

        const backgroundColor = this.props?.backgroundColor;
        if (backgroundColor) {
            const color = parseColor(backgroundColor);
            border.SetBrushColor(new UE.LinearColor(color.r, color.g, color.b, color.a));
        }

        const backgroundImage = this.props?.backgroundImage;
        if (backgroundImage) {
            const image = parseBrush(backgroundImage);
            border.SetBrush(image);
        }

        const contentColor = this.props?.contentColor;
        if (contentColor) {
            const color = parseColor(contentColor);
            border.SetContentColorAndOpacity(new UE.LinearColor(color.r, color.g, color.b, color.a));
        }

        const contentHorizontalAlign = this.props?.contentHorizontalAlign;
        if (contentHorizontalAlign) {
            switch (contentHorizontalAlign) {
                case 'left':
                    border.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Left);
                    break;
                case 'center':
                    border.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Center);
                    break;
                case 'right':
                    border.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Right);
                    break;
                case 'fill':
                    border.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Fill);
                    break;
                default:
                    console.warn(`Invalid content horizontal align: ${contentHorizontalAlign}`);
                    border.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Fill);
                    break;
            }
        }

        const contentVerticalAlign = this.props?.contentVerticalAlign;
        if (contentVerticalAlign) {
            switch (contentVerticalAlign) {
                case 'top':
                    border.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Top);
                    break;
                case 'center':
                    border.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Center);
                    break;
                case 'bottom':
                    border.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Bottom);
                    break;
                case 'fill':
                    border.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Fill);
                    break;
                default:
                    console.warn(`Invalid content vertical align: ${contentVerticalAlign}`);
                    border.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Fill);
                    break;
            }
        }

        const contentPadding = this.props?.contentPadding;
        const contentMargin = this.props?.contentMargin;
        if (contentPadding || contentMargin) {
            const padding = convertMargin(contentPadding || contentMargin, this.props);
            border.SetPadding(padding);
        }

        {
            let bindEvent = false;
            const onMouseButtonDown = this.props?.onMouseButtonDown;
            if (onMouseButtonDown && typeof onMouseButtonDown === 'function') {
                border.OnMouseButtonDownEvent.Bind(
                    (MyGeometry: UE.Geometry, MouseEvent: UE.PointerEvent) => {
                    onMouseButtonDown();
                    return new UE.EventReply();
                });
                bindEvent = true;
            }
    
            const onMouseButtonUp = this.props?.onMouseButtonUp;
            if (onMouseButtonUp && typeof onMouseButtonUp === 'function') {
                border.OnMouseButtonUpEvent.Bind(
                    (MyGeometry: UE.Geometry, MouseEvent: UE.PointerEvent) => {
                    onMouseButtonUp();
                    return new UE.EventReply();
                });
                bindEvent = true;
            }
    
            const onMouseMove = this.props?.onMouseMove;
            if (onMouseMove && typeof onMouseMove === 'function') {
                border.OnMouseMoveEvent.Bind(
                    (MyGeometry: UE.Geometry, MouseEvent: UE.PointerEvent) => {
                    onMouseMove();
                    return new UE.EventReply();
                });
                bindEvent = true;
            }
    
            const onMouseDoubleClick = this.props?.onMouseDoubleClick;
            if (onMouseDoubleClick && typeof onMouseDoubleClick === 'function') {
                border.OnMouseDoubleClickEvent.Bind(
                    (MyGeometry: UE.Geometry, MouseEvent: UE.PointerEvent) => {
                    onMouseDoubleClick();
                    return new UE.EventReply();
                });
                bindEvent = true;
            }

            if (bindEvent) {
                UE.UMGManager.SynchronizeWidgetProperties(border);
            }
        }

        return border;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        const border = widget as UE.Border;
        let propsChange = false;
        return propsChange;
    }
}

