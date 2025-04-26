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
import { convertLengthUnitToSlateUnit, parseScale, parseAspectRatio } from "../parsers/css_length_parser";
import { safeParseFloat } from "../misc/utils";
import { parseWidgetSelfAlignment } from "../parsers/alignment_parser";
/**
 * 将容器参数以及布局参数转换中通用的功能实现在这个类中
 */
export class ContainerConverter extends ElementConverter {
    containerType: string;
    containerStyle: any;
    proxy: ContainerConverter;
    originalWidget: UE.Widget;
    externalSlot: UE.PanelSlot; // 保存外部添加的容器slot
    wrapBoxWidget: UE.Widget; // 保存wrapbox容器
    sizeBoxWidget: UE.Widget; // 保存sizebox容器
    scaleBoxWidget: UE.Widget; // 保存scalebox容器
    borderWidget: UE.Widget; // 保存border容器

    private childConverters: Record<string, any>;

    constructor(typeName: string, props: any) {
        super(typeName, props);
        this.containerStyle = getAllStyles(this.typeName, this.props);
        this.containerType = this.parseContainerType(this.typeName);
        this.externalSlot = null;

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

    private setupFlexWrap(widget: UE.Widget, wrapBoxWidget?: UE.Widget, updateProps?: any): UE.Widget {
        let style = this.containerStyle;
        if (updateProps) {
            style = getAllStyles(this.typeName, updateProps);
        }

        const flexWrap = style?.flexWrap || 'nowrap';
        if (flexWrap !== 'wrap' || flexWrap !== 'wrap-reverse') {
            return widget;
        }

        if (!wrapBoxWidget) {
            wrapBoxWidget = new UE.WrapBox();
        }
        const wrapBox = wrapBoxWidget as UE.WrapBox;
        const flexDirection = style?.flexDirection;
        const gap = style?.gap;

        if (flexDirection) {    
            wrapBox.Orientation = 
                (flexDirection === 'column'|| flexDirection === 'column-reverse')
                ? UE.EOrientation.Orient_Vertical : UE.EOrientation.Orient_Horizontal;
        }

        if (gap) {
            wrapBox.SetInnerSlotPadding(convertGap(gap, style));
        }

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
        const justifyItems = style?.justifyItems;
        if (justifyItems) {
            justifyItems.split(' ')
                .filter(value => justifyItemsActionMap[value])
                .forEach(value => justifyItemsActionMap[value]());
        }

        if (!updateProps) {
            this.externalSlot = wrapBox.AddChild(widget) as UE.WrapBoxSlot;
        }

        return wrapBox;
    }

    private setupBackground(widget: UE.Widget, borderWidget?: UE.Widget, updateProps?: any): UE.Widget {
        let style = this.containerStyle;
        if (updateProps) {
            style = getAllStyles(this.typeName, updateProps);
        }

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
            if (!borderWidget) {
                borderWidget = new UE.Border();
            }
            const border = borderWidget as UE.Border;
            if (parsedBackgroundProps?.image) {
                border.SetBrush(parsedBackgroundProps.image);
                useBorder = true;
            }
            if (parsedBackgroundProps?.color) {
                border.SetBrushColor(parsedBackgroundProps.color);
                useBorder = true;
            }
            if (parsedBackgroundProps?.alignment) {
                border.SetVerticalAlignment(parsedBackgroundProps.alignment?.vertical);
                border.SetHorizontalAlignment(parsedBackgroundProps.alignment?.horizontal);
                border.SetPadding(parsedBackgroundProps.alignment?.padding);
            }

            const scale = style?.scale;
            border.SetDesiredSizeScale(parseScale(scale));
            
            // color
            const contentColor = style?.color;
            if (contentColor) {
                const color = parseColor(contentColor);
                border.SetContentColorAndOpacity(
                    new UE.LinearColor(color.r / 255.0, color.g / 255.0, color.b / 255.0, color.a)
                );
            }

            if (useBorder && !updateProps) {
                this.externalSlot = border.AddChild(widget) as UE.BorderSlot;
            } else {
                return widget;
            }

            return border; 
        }
    }

    private setupBoxSize(Widget: UE.Widget, sizeBoxWidget?: UE.Widget, updateProps?: any): UE.Widget {
        let style = this.containerStyle;
        if (updateProps) {
            style = getAllStyles(this.typeName, updateProps);
        }

        const width = style?.width || 'auto';
        const height = style?.height || 'auto';

        if (width === 'auto' && height === 'auto') {
            return Widget;
        } else {
            if (!sizeBoxWidget) {
                sizeBoxWidget = new UE.SizeBox();
            }
            const sizeBox = sizeBoxWidget as UE.SizeBox;
            if (width !== 'auto') {
                sizeBox.SetWidthOverride(convertLengthUnitToSlateUnit(width, this.containerStyle));
            }

            if (height !== 'auto') {
                sizeBox.SetHeightOverride(convertLengthUnitToSlateUnit(height, this.containerStyle));
            }

            const maxWidth = this.containerStyle?.maxWidth;
            if (maxWidth) {
                sizeBox.SetMaxDesiredWidth(convertLengthUnitToSlateUnit(maxWidth, this.containerStyle));
            }
            
            const maxHeight = this.containerStyle?.maxHeight;
            if (maxHeight) {
                sizeBox.SetMaxDesiredHeight(convertLengthUnitToSlateUnit(maxHeight, this.containerStyle));
            }

            const minWidth = this.containerStyle?.minWidth;
            if (minWidth) {
                sizeBox.SetMinDesiredWidth(convertLengthUnitToSlateUnit(minWidth, this.containerStyle));
            }

            const minHeight = this.containerStyle?.minHeight;
            if (minHeight) {
                sizeBox.SetMinDesiredHeight(convertLengthUnitToSlateUnit(minHeight, this.containerStyle));
            }

            const aspectRatio = this.containerStyle?.aspectRatio;
            if (aspectRatio) {
                sizeBox.SetMaxAspectRatio(parseAspectRatio(aspectRatio));
                sizeBox.SetMinAspectRatio(parseAspectRatio(aspectRatio));
            }

            if (!updateProps) {
                this.externalSlot = sizeBox.AddChild(Widget) as UE.SizeBoxSlot;
            }

            return sizeBox;
        }
    }

    private setupBoxScale(widget: UE.Widget, scaleBoxWidget?: UE.Widget, updateProps?: any): UE.Widget {
        let style = this.containerStyle;
        if (updateProps) {
            style = getAllStyles(this.typeName, updateProps);
        }
        
        const objectFit = style?.objectFit;
        if (objectFit) {
            if (!scaleBoxWidget) {
                scaleBoxWidget = new UE.ScaleBox();
            }
            const scaleBox = scaleBoxWidget as UE.ScaleBox;
            if (objectFit === 'contain') {
                scaleBox.SetStretch(UE.EStretch.ScaleToFit)
            } else if (objectFit === 'cover') {
                scaleBox.SetStretch(UE.EStretch.ScaleToFill);
            } else if (objectFit === 'fill') {
                scaleBox.SetStretch(UE.EStretch.Fill);
            } else if (objectFit === 'none') {
                scaleBox.SetStretch(UE.EStretch.None);
            } else if (objectFit === 'scale-down') {
                scaleBox.SetStretch(UE.EStretch.UserSpecifiedWithClipping);
                const scale = style?.scale;
                if (scale) {
                    scaleBox.SetUserSpecifiedScale(safeParseFloat(scale));
                }
            }
            
            this.externalSlot = scaleBox.AddChild(widget) as UE.ScaleBoxSlot;

            return scaleBox;
        } else {
            return widget;
        }
    }

    private initClipChildWidget(parentWidget: UE.Widget) {
        const style = this.containerStyle;
        const visibility = style?.visibility;
        if (visibility === 'clip') {
            parentWidget.SetClipping(UE.EWidgetClipping.ClipToBounds);
        }
    }

    private initChildAlignmentForExternalSlot(childProps: any) {
        if (childProps && this.externalSlot ) {
            const Style = getAllStyles(this.typeName, childProps);
            const childAlignment = parseWidgetSelfAlignment(Style);
            if (this.externalSlot instanceof UE.SizeBoxSlot) {
                (this.externalSlot as UE.SizeBoxSlot).SetHorizontalAlignment(childAlignment.horizontal);
                (this.externalSlot as UE.SizeBoxSlot).SetVerticalAlignment(childAlignment.vertical);
                (this.externalSlot as UE.SizeBoxSlot).SetPadding(childAlignment.padding);
            } else if (this.externalSlot instanceof UE.ScaleBoxSlot) {
                (this.externalSlot as UE.ScaleBoxSlot).SetHorizontalAlignment(childAlignment.horizontal);
                (this.externalSlot as UE.ScaleBoxSlot).SetVerticalAlignment(childAlignment.vertical);
                (this.externalSlot as UE.ScaleBoxSlot).SetPadding(childAlignment.padding);
            } else if (this.externalSlot instanceof UE.BorderSlot) {
                (this.externalSlot as UE.BorderSlot).SetHorizontalAlignment(childAlignment.horizontal);
                (this.externalSlot as UE.BorderSlot).SetVerticalAlignment(childAlignment.vertical);
                (this.externalSlot as UE.BorderSlot).SetPadding(childAlignment.padding);
            } else if (this.externalSlot instanceof UE.WrapBoxSlot) {
                (this.externalSlot as UE.WrapBoxSlot).SetHorizontalAlignment(childAlignment.horizontal);
                (this.externalSlot as UE.WrapBoxSlot).SetVerticalAlignment(childAlignment.vertical);
                (this.externalSlot as UE.WrapBoxSlot).SetPadding(childAlignment.padding);
            }
        }
    }

    createNativeWidget(): UE.Widget {
        let widget: UE.Widget = null;
        if (this.proxy) {
            widget = this.proxy.createNativeWidget();
            this.originalWidget = widget;

            if (widget) {
                this.wrapBoxWidget = this.setupFlexWrap(widget);
                widget = this.wrapBoxWidget;
            }

            if (this.wrapBoxWidget) {
                this.borderWidget = this.setupBackground(widget);
                widget = this.borderWidget;
            }

            if (this.borderWidget) {
                this.sizeBoxWidget = this.setupBoxSize(widget);
                widget = this.sizeBoxWidget;
            }

            if (this.sizeBoxWidget) {
                this.scaleBoxWidget = this.setupBoxScale(widget);
                widget = this.scaleBoxWidget;
            }
        }

        return widget;
    }

    update(widget: UE.Widget, oldProps: any, changedProps: any): void {
        if (this.proxy) {
            this.proxy.update(widget, oldProps, changedProps);
            // update props
            if (this.wrapBoxWidget) {
                this.setupFlexWrap(widget, this.wrapBoxWidget, changedProps);
            }
            if (this.borderWidget) {
                this.setupBackground(widget, this.borderWidget, changedProps);
            }
            if (this.sizeBoxWidget) {
                this.setupBoxSize(widget, this.sizeBoxWidget, changedProps);
            }
            if (this.scaleBoxWidget) {
                this.setupBoxScale(widget, this.scaleBoxWidget, changedProps);
            }
        }
    }

    appendChild(parent: UE.Widget, child: UE.Widget, childTypeName: string, childProps: any): void {
        if (this.proxy) {
            this.initClipChildWidget(parent);
            this.initChildAlignmentForExternalSlot(childProps);
            this.proxy.appendChild(this.originalWidget, child, childTypeName, childProps);
        }
    }

    removeChild(parent: UE.Widget, child: UE.Widget): void {
        child.RemoveFromParent();
    }
}
