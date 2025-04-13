import * as UE from 'ue';
import { ComponentWrapper } from "../common_wrapper";
import { convertLengthUnitToSlateUnit, 
    mergeClassStyleAndInlineStyle, 
    parseAspectRatio, parseBackgroundProps, safeParseFloat,
    convertGap, parseScale, parseChildAlignment } from '../common_utils';
import { parseColor } from '../parser/color_parser';
import { GridPanelWrapper } from './gridpanel';
import { ScrollBoxWrapper } from './scrollbox';
import { FlexWrapper } from './flex';

export enum UMGContainerType {
    ScrollBox,
    GridPanel,
    Flex,
    HorizontalBox,
    VerticalBox,
    WrapBox, 
    StackBox
}

export class ContainerWrapper extends ComponentWrapper {
    private containerStyle: any;
    private commonWrapper: ComponentWrapper;
    private originWidget: UE.Widget;
    private extraBoxSlot: UE.PanelSlot;

    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    override convertToWidget(): UE.Widget { 
        this.containerStyle = mergeClassStyleAndInlineStyle(this.props);

        const display = this.containerStyle?.display || 'flex';
        const overflow = this.containerStyle?.overflow || 'visible';
        const overflowX = this.containerStyle?.overflowX || 'visible';
        const overflowY = this.containerStyle?.overflowY || 'visible';
        

        let widget: UE.Widget;
        // Convert to appropriate UMG container based on style
        if (overflow !== 'visible' || overflowX !== 'visible' || overflowY !== 'visible') {

            let scrollBoxWrapper = new ScrollBoxWrapper(this.typeName, this.props);
            widget = scrollBoxWrapper.convertToWidget();
            this.commonWrapper = scrollBoxWrapper;

        } else if (display === 'grid') {

            // grid panel
            let gridPanelWrapper = new GridPanelWrapper(this.typeName, this.props);
            widget = gridPanelWrapper.convertToWidget();
            this.commonWrapper = gridPanelWrapper;

        } else {
            let flexWrapper = new FlexWrapper(this.typeName, this.props);
            widget = flexWrapper.convertToWidget();
            this.commonWrapper = flexWrapper;
        }

        this.originWidget = widget;

        widget = this.setupWrapBox(widget);
        widget = this.setupBorderAndBackground(widget);
        widget = this.setupBoxSize(widget);
        widget = this.setupBoxScale(widget);
        
        return widget;
    }

    private setupVisibility(parentItem: UE.Widget) {
        const visibility = this.containerStyle?.visibility || 'visible';
        if (visibility === 'hidden' || visibility === 'clip') {
            parentItem.SetClipping(UE.EWidgetClipping.ClipToBounds);
        }
    }

    private setupBoxSize(Item: UE.Widget, Props?: any): UE.Widget {
        let childStyle: any = {};
        if (!Props) {
            childStyle = this.containerStyle;
        } else {
            childStyle = mergeClassStyleAndInlineStyle(Props);
        }

        const width = childStyle?.width || 'auto';
        const height = childStyle?.height || 'auto';

        if (width === 'auto' && height === 'auto') {
            return Item;
        } else {
            const sizeBox = new UE.SizeBox();
            if (width !== 'auto') {
                sizeBox.SetWidthOverride(convertLengthUnitToSlateUnit(width, childStyle));
            }

            if (height !== 'auto') {
                sizeBox.SetHeightOverride(convertLengthUnitToSlateUnit(height, childStyle));
            }

            const maxWidth = this.containerStyle?.maxWidth;
            if (maxWidth) {
                sizeBox.SetMaxDesiredWidth(convertLengthUnitToSlateUnit(maxWidth, childStyle));
            }
            
            const maxHeight = this.containerStyle?.maxHeight;
            if (maxHeight) {
                sizeBox.SetMaxDesiredHeight(convertLengthUnitToSlateUnit(maxHeight, childStyle));
            }

            const minWidth = this.containerStyle?.minWidth;
            if (minWidth) {
                sizeBox.SetMinDesiredWidth(convertLengthUnitToSlateUnit(minWidth, childStyle));
            }

            const minHeight = this.containerStyle?.minHeight;
            if (minHeight) {
                sizeBox.SetMinDesiredHeight(convertLengthUnitToSlateUnit(minHeight, childStyle));
            }

            const aspectRatio = this.containerStyle?.aspectRatio;
            if (aspectRatio) {
                sizeBox.SetMaxAspectRatio(parseAspectRatio(aspectRatio));
                sizeBox.SetMinAspectRatio(parseAspectRatio(aspectRatio));
            }

            this.extraBoxSlot = sizeBox.AddChild(Item) as UE.SizeBoxSlot;

            return sizeBox;
        }
    }

    private setupBoxScale(Item: UE.Widget, Props?: any): UE.Widget {
        let childStyle: any = {};
        if (!Props) {
            childStyle = this.containerStyle;
        } else {
            childStyle = mergeClassStyleAndInlineStyle(Props);
        }
        
        const objectFit = childStyle?.objectFit;
        if (objectFit) {
            const scaleBox = new UE.ScaleBox();
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
                const scale = childStyle?.scale;
                if (scale) {
                    scaleBox.SetUserSpecifiedScale(safeParseFloat(scale));
                }
            }
            
            this.extraBoxSlot = scaleBox.AddChild(Item) as UE.ScaleBoxSlot;
            return scaleBox;
        } else {
            return Item;
        }
    }

    private setupWrapBox(Item: UE.Widget, Props?: any): UE.Widget {
        let childStyle: any = {};
        if (!Props) {
            childStyle = this.containerStyle;
        } else {
            childStyle = mergeClassStyleAndInlineStyle(Props);
        }

        const flexWrap = childStyle?.flexWrap || 'nowrap';
        if (flexWrap !== 'wrap' || flexWrap !== 'wrap-reverse') {
            return Item;
        }

        const wrapBox = new UE.WrapBox();
        const flexDirection = childStyle?.flexDirection;
        const gap = childStyle?.gap;


        wrapBox.Orientation = 
            (flexDirection === 'column'|| flexDirection === 'column-reverse')
            ? UE.EOrientation.Orient_Vertical : UE.EOrientation.Orient_Horizontal;

        wrapBox.SetInnerSlotPadding(convertGap(gap, childStyle));

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

        // WrapBox中定义的justifyItems决定了子元素的对齐方式
        const justifyItems = this.containerStyle?.justifyItems;
        if (justifyItems) {
            justifyItems.split(' ')
                .filter(value => justifyItemsActionMap[value])
                .forEach(value => justifyItemsActionMap[value]());
        }

        this.extraBoxSlot = wrapBox.AddChild(Item) as UE.WrapBoxSlot;

        return wrapBox;
    }

    private setupBackground(Item: UE.Widget, style?: any): UE.Widget {

        const parsedBackground = parseBackgroundProps(style);
        // 将background转换为image, repeat, color, position等内容

        let useBorder = false;  
        const borderWidget = new UE.Border();
        if (parsedBackground?.image) {
            borderWidget.SetBrush(parsedBackground.image);
            useBorder = true;
        }
        if (parsedBackground?.color) {
            borderWidget.SetBrushColor(parsedBackground.color);
            useBorder = true;
        }

        if (parsedBackground?.alignment) {
            borderWidget.SetVerticalAlignment(parsedBackground.alignment?.vertical);
            borderWidget.SetHorizontalAlignment(parsedBackground.alignment?.horizontal);
            borderWidget.SetPadding(parsedBackground.alignment?.padding);
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
            this.extraBoxSlot = borderWidget.AddChild(Item) as UE.BorderSlot;
        } else {
            return Item;
        }

        return borderWidget; 
    }

    private setupBorder(Item: UE.Widget, Props?: any): UE.Widget {
        const borderWidget = new UE.Border();
        this.extraBoxSlot = borderWidget.AddChild(Item) as UE.BorderSlot;
        return borderWidget;
    }

    private setupBorderAndBackground(Item: UE.Widget, Props?: any): UE.Widget {
        let childStyle: any = {};
        if (!Props) {
            childStyle = this.containerStyle;
        } else {
            childStyle = mergeClassStyleAndInlineStyle(Props);
        }

        const background = childStyle?.background;
        const backgroundColor = childStyle?.backgroundColor;
        const backgroundImage = childStyle?.backgroundImage;
        const backgroundPosition = childStyle?.backgroundPosition;

        const usingBackground = backgroundColor || backgroundImage || backgroundPosition || background;
        
        if (usingBackground) {
            return this.setupBackground(Item, childStyle);
        }

        return Item;
    }

    private setupChildAlignment(props?: any) {
        if (props && this.extraBoxSlot ) {
            const Style = mergeClassStyleAndInlineStyle(props);
            const childAlignment = parseChildAlignment(Style);
            if (this.extraBoxSlot instanceof UE.SizeBoxSlot) {
                (this.extraBoxSlot as UE.SizeBoxSlot).SetHorizontalAlignment(childAlignment.horizontal);
                (this.extraBoxSlot as UE.SizeBoxSlot).SetVerticalAlignment(childAlignment.vertical);
                (this.extraBoxSlot as UE.SizeBoxSlot).SetPadding(childAlignment.padding);
            } else if (this.extraBoxSlot instanceof UE.ScaleBoxSlot) {
                (this.extraBoxSlot as UE.ScaleBoxSlot).SetHorizontalAlignment(childAlignment.horizontal);
                (this.extraBoxSlot as UE.ScaleBoxSlot).SetVerticalAlignment(childAlignment.vertical);
                (this.extraBoxSlot as UE.ScaleBoxSlot).SetPadding(childAlignment.padding);
            } else if (this.extraBoxSlot instanceof UE.BorderSlot) {
                (this.extraBoxSlot as UE.BorderSlot).SetHorizontalAlignment(childAlignment.horizontal);
                (this.extraBoxSlot as UE.BorderSlot).SetVerticalAlignment(childAlignment.vertical);
                (this.extraBoxSlot as UE.BorderSlot).SetPadding(childAlignment.padding);
            } else if (this.extraBoxSlot instanceof UE.WrapBoxSlot) {
                (this.extraBoxSlot as UE.WrapBoxSlot).SetHorizontalAlignment(childAlignment.horizontal);
                (this.extraBoxSlot as UE.WrapBoxSlot).SetVerticalAlignment(childAlignment.vertical);
                (this.extraBoxSlot as UE.WrapBoxSlot).SetPadding(childAlignment.padding);
            }
        }
    }

    override appendChildItem(parentItem: UE.Widget, childItem: UE.Widget, childItemTypeName: string, childProps?: any): void {
        // 1. 设置父容器的clip属性
        // 2. 根据width, height添加size box并设置大小
        // 3. 根据objectFit添加scale box并设置缩放
        // 4. 添加background
        if (!childItem) {
            console.warn(`childItem ${childItemTypeName} is null, can not append to container: ${this.typeName}`);
            return;
        }

        this.setupVisibility(parentItem);
        this.setupChildAlignment(childProps);
        this.commonWrapper.appendChildItem(this.originWidget, childItem, childItemTypeName, childProps);
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps : any, newProps: any, updateProps: Record<string, any>) : boolean {
        return;
    }
}