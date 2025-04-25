import { EHorizontalAlignment, EOrientation, Widget, WrapBox } from "ue";
import { ElementConverter } from "../converter";
import { getAllStyles } from "../parsers/cssstyle_parser";
import { FlexConverter } from "./flex";
import { CanvasConverter } from "./canvas";
import { GridConverter } from "./grid";
import { OverlayConverter } from "./overlay";
import { convertGap } from "../parsers/css_length_parser";

/**
 * 将容器参数以及布局参数转换中通用的功能实现在这个类中
 */
export class ContainerConverter extends ElementConverter {
    containerType: string;
    containerStyle: any;
    proxy: ContainerConverter;
    originalWidget: Widget;
    
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

    private setupFlexWrap(widget: Widget, props: any): Widget {
        const style = getAllStyles(this.typeName, props);

        const flexWrap = style?.flexWrap || 'nowrap';
        
        if (flexWrap !== 'wrap' || flexWrap !== 'wrap-reverse') {
            return widget;
        }

        const wrapBox = new WrapBox();
        const flexDirection = style?.flexDirection;
        const gap = style?.gap; 


        wrapBox.Orientation = 
            (flexDirection === 'column'|| flexDirection === 'column-reverse')
            ? EOrientation.Orient_Vertical : EOrientation.Orient_Horizontal;

        wrapBox.SetInnerSlotPadding(convertGap(gap, style));

        const justifyItemsActionMap = {
            'flex-start': () => wrapBox.SetHorizontalAlignment(EHorizontalAlignment.HAlign_Left),
            'flex-end': () => wrapBox.SetHorizontalAlignment(EHorizontalAlignment.HAlign_Right),
            'start': () => wrapBox.SetHorizontalAlignment(EHorizontalAlignment.HAlign_Left),
            'end': () => wrapBox.SetHorizontalAlignment(EHorizontalAlignment.HAlign_Right),
            'left': () => wrapBox.SetHorizontalAlignment(EHorizontalAlignment.HAlign_Left),
            'right': () => wrapBox.SetHorizontalAlignment(EHorizontalAlignment.HAlign_Right),
            'center': () => wrapBox.SetHorizontalAlignment(EHorizontalAlignment.HAlign_Center),
            'stretch': () => wrapBox.SetHorizontalAlignment(EHorizontalAlignment.HAlign_Fill)
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

    private setupBackground(widget: Widget, props: any): Widget {
        const style = getAllStyles(this.typeName, props);
        const background = style?.background;
        const backgroundColor = style?.backgroundColor;
        const backgroundImage = style?.backgroundImage;
        const backgroundPosition = style?.backgroundPosition;

        const usingBackground = backgroundColor || backgroundImage || backgroundPosition || background;
        
        if (!usingBackground) {
            return widget;
        } else {
            
        }
        return widget;
    }

    createNativeWidget(): Widget {
        let widget: Widget = null;
        if (this.proxy) {
            widget = this.proxy.createNativeWidget();
        }



        return widget;
    }

    update(widget: Widget, oldProps: any, changedProps: any): void {
        if (this.proxy) {
            this.proxy.update(widget, oldProps, changedProps);
        }
    }

    appendChild(parent: Widget, child: Widget): void {
        if (this.proxy) {
            this.proxy.appendChild(parent, child);
        }
    }

    removeChild(parent: Widget, child: Widget): void {
        if (this.proxy) {
            this.proxy.removeChild(parent, child);
        }
    }
}
