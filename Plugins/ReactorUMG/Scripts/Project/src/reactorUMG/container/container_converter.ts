import * as UE from "ue";
import { ElementConverter } from "../converter";
import { getAllStyles } from "../parsers/cssstyle_parser";
import { FlexConverter } from "./flex";
import { CanvasConverter } from "./canvas";
import { GridConverter } from "./grid";
import { OverlayConverter } from "./overlay";
import { convertGap } from "../parsers/css_margin_parser";
import { parseBackgroundProps } from "../parsers/css_background_parser";
import { parseColor } from "../parsers/css_color_parser";
import { parseScale } from "../parsers/css_length_parser";
/**
 * 将容器参数以及布局参数转换中通用的功能实现在这个类中
 */
export class ContainerConverter extends ElementConverter {
    containerType: string;
    containerStyle: any;
    proxy: ContainerConverter;
    originalWidget: UE.Widget;
    externalSlot: UE.PanelSlot; // 保存外部添加的容器slot
    
    private childConverters: Record<string, any>;

    constructor(typeName: string, props: any) {
        super(typeName, props);
        this.containerStyle = getAllStyles(this.typeName, this.props);
        this.containerType = this.parseContainerType(this.typeName);

        this.childConverters = {
            "flex": FlexConverter,
            "grid": GridConverter,
            "canvas": CanvasConverter,
            "overlay": OverlayConverter,
        };

        if (this.childConverters.includes(this.containerType)) {
            this.proxy = new this.childConverters[this.containerType](this.typeName, this.props);
        }
    }
    
    private parseContainerType(type: string) {
        if (type === 'div') {
            const display = this.containerStyle?.display || 'flex';
            if (display === 'grid') {
                return 'grid';
            } else {
                return 'flex';
            }
        } else {
            return type.toLowerCase();
        }
    }

    private setupFlexWrap(widget: UE.Widget, props: any): UE.Widget {
        const style = getAllStyles(this.typeName, props);

        const flexWrap = style?.flexWrap || 'nowrap';
        
        if (flexWrap !== 'wrap' || flexWrap !== 'wrap-reverse') {
            return widget;
        }

        const wrapBox = new UE.WrapBox();
        const flexDirection = style?.flexDirection;
        const gap = style?.gap; 


        wrapBox.Orientation = 
            (flexDirection === 'column'|| flexDirection === 'column-reverse')
            ? UE.EOrientation.Orient_Vertical : UE.EOrientation.Orient_Horizontal;

        wrapBox.SetInnerSlotPadding(convertGap(gap, style));

        const justifyItemsActionMap = {
            'flex-start': () => wrapBox.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Left),
            'flex-end': () => wrapBox.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Right),
            'start': () => wrapBox.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Left),
            'end': () => wrapBox.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Right),
            'left': () => wrapBox.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Left),
            'right': () => wrapBox.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Right),
            'center': () => wrapBox.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Center),
            'stretch': () => wrapBox.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Fill)
        }

        // WrapBox中定义的justifyItems决定了子元素的主轴对齐方式
        const justifyItems = this.containerStyle?.justifyItems;
        if (justifyItems) {
            justifyItems.split(' ')
                .filter(value => justifyItemsActionMap[value])
                .forEach(value => justifyItemsActionMap[value]());
        }

        // this.extraBoxSlot = wrapBox.AddChild(Item) as UE.WrapBoxSlot;

        return wrapBox;
    }

    private setupBackground(widget: UE.Widget, props: any): UE.Widget {
        const style = getAllStyles(this.typeName, props);
        const background = style?.background;
        const backgroundColor = style?.backgroundColor;
        const backgroundImage = style?.backgroundImage;
        const backgroundPosition = style?.backgroundPosition;

        const usingBackground = backgroundColor || backgroundImage || backgroundPosition || background;
        
        if (!usingBackground) {
            return widget;
        } else {
            const parsedBackgroundProps = parseBackgroundProps(style);
            
            let useBorder = false;  
            const borderWidget = new UE.Border();
            if (parsedBackgroundProps?.image) {
                borderWidget.SetBrush(parsedBackgroundProps.image);
                useBorder = true;
            }
            if (parsedBackgroundProps?.color) {
                borderWidget.SetBrushColor(parsedBackgroundProps.color);
                useBorder = true;
            }
            if (parsedBackgroundProps?.alignment) {
                borderWidget.SetVerticalAlignment(parsedBackgroundProps.alignment?.vertical);
                borderWidget.SetHorizontalAlignment(parsedBackgroundProps.alignment?.horizontal);
                borderWidget.SetPadding(parsedBackgroundProps.alignment?.padding);
            }

            const scale = style?.scale;
            borderWidget.SetDesiredSizeScale(parseScale(scale));
            
            // color
            const contentColor = style?.color;
            if (contentColor) {
                const color = parseColor(contentColor);
                borderWidget.SetContentColorAndOpacity(
                    new UE.LinearColor(color.r / 255.0, color.g / 255.0, color.b / 255.0, color.a)
                );
            }

            if (useBorder) {
                this.externalSlot = borderWidget.AddChild(widget) as UE.BorderSlot;
            } else {
                return widget;
            }

            return borderWidget; 
        }
    }

    createNativeWidget(): UE.Widget {
        let widget: UE.Widget = null;
        if (this.proxy) {
            widget = this.proxy.createNativeWidget();
        }
        return widget;
    }

    update(widget: UE.Widget, oldProps: any, changedProps: any): void {
        if (this.proxy) {
            this.proxy.update(widget, oldProps, changedProps);
        }
    }

    appendChild(parent: UE.Widget, child: UE.Widget): void {
        if (this.proxy) {
            this.proxy.appendChild(parent, child);
        }
    }

    removeChild(parent: UE.Widget, child: UE.Widget): void {
        if (this.proxy) {
            this.proxy.removeChild(parent, child);
        }
    }
}
