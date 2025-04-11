import { UMGContainerType } from "./container";
import { ComponentWrapper } from "../common_wrapper";
import * as UE from 'ue';
import { convertGap, convertMargin, mergeClassStyleAndInlineStyle } from "../common_utils";

export class ScrollBoxWrapper extends ComponentWrapper {
    private containerStyle: any;
    private isScrollX: boolean;
    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }
  
    private setupScrollBox(scrollBox: UE.ScrollBox) {
        if (this.isScrollX) {
            scrollBox.SetOrientation(UE.EOrientation.Orient_Horizontal);
        } else {
            scrollBox.SetOrientation(UE.EOrientation.Orient_Vertical);
        }

        // setup scrollbar thickness
        const scrollbarWidth = this.containerStyle?.scrollbarWidth || 'auto';
        const scrollbarLevel = {
            'auto': 14,
            'thin': 10
        }

        if (scrollbarWidth === 'none') {
            scrollBox.SetScrollBarVisibility(UE.ESlateVisibility.Collapsed);
        } else {
            if (scrollbarWidth in scrollbarLevel) {
                scrollBox.SetScrollbarThickness(new UE.Vector2D(scrollbarLevel[scrollbarWidth], scrollbarLevel[scrollbarWidth]));
            } else if (scrollbarWidth.endsWith('px')) {
                // Extract the numeric part by removing the 'px' suffix
                const numericWidth = parseInt(scrollbarWidth.slice(0, -2));
                scrollBox.SetScrollbarThickness(new UE.Vector2D(numericWidth, numericWidth));
            }

            scrollBox.SetScrollBarVisibility(UE.ESlateVisibility.Visible);
        }

        const scrollPadding = this.containerStyle?.scrollPadding || '0px';
        scrollBox.SetScrollbarPadding(convertMargin(scrollPadding, this.containerStyle));

        const onScroll = this.containerStyle?.onScroll;
        if (onScroll && typeof onScroll === 'function') {
            scrollBox.OnUserScrolled.Add((CurrentOffset: number)=> {onScroll(CurrentOffset)});
        }
    }

    private setupAlignment(Slot: UE.PanelSlot, childStyle: any) {
        const alignSelf = childStyle?.alignSelf || 'stretch';
        const justifySelf = childStyle?.justifySelf || 'stretch';

        const scrollBoxStretchHorizontalAlignmentFunc = (scrollBoxSlot: UE.ScrollBoxSlot) => {
            scrollBoxSlot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Fill);
        }

        const scrollBoxLeftHorizontalAlignmentFunc = (scrollBoxSlot: UE.ScrollBoxSlot) => {
            scrollBoxSlot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Left);
        }

        const scrollBoxRightHorizontalAlignmentFunc = (scrollBoxSlot: UE.ScrollBoxSlot) => {
            scrollBoxSlot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Right);
        }

        const scrollBoxCenterHorizontalAlignmentFunc = (scrollBoxSlot: UE.ScrollBoxSlot) => {
            scrollBoxSlot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Center);
        }

        const scrollBoxStretchVerticalAlignmentFunc = (scrollBoxSlot: UE.ScrollBoxSlot) => {
            scrollBoxSlot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Fill);
        }

        const scrollBoxTopVerticalAlignmentFunc = (scrollBoxSlot: UE.ScrollBoxSlot) => {
            scrollBoxSlot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Top);
        }

        const scrollBoxBottomVerticalAlignmentFunc = (scrollBoxSlot: UE.ScrollBoxSlot) => {
            scrollBoxSlot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Bottom);
        }

        const scrollBoxCenterVerticalAlignmentFunc = (scrollBoxSlot: UE.ScrollBoxSlot) => { 
            scrollBoxSlot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Center);
        }

        const scrollBoxHorizontalActionMap = {
            'stretch': scrollBoxStretchHorizontalAlignmentFunc,
            'left': scrollBoxLeftHorizontalAlignmentFunc,
            'right': scrollBoxRightHorizontalAlignmentFunc,
            'center': scrollBoxCenterHorizontalAlignmentFunc,
            'start': scrollBoxLeftHorizontalAlignmentFunc,
            'end': scrollBoxRightHorizontalAlignmentFunc,
            'flex-start': scrollBoxLeftHorizontalAlignmentFunc,
            'flex-end': scrollBoxRightHorizontalAlignmentFunc,
        }

        const scrollBoxVerticalActionMap = {
            'stretch': scrollBoxStretchVerticalAlignmentFunc,
            'top': scrollBoxTopVerticalAlignmentFunc,
            'bottom': scrollBoxBottomVerticalAlignmentFunc,
            'center': scrollBoxCenterVerticalAlignmentFunc,
            'start': scrollBoxTopVerticalAlignmentFunc,
            'end': scrollBoxBottomVerticalAlignmentFunc,
            'flex-start': scrollBoxTopVerticalAlignmentFunc,
            'flex-end': scrollBoxBottomVerticalAlignmentFunc,
        }
        const scrollBoxSlot = Slot as UE.ScrollBoxSlot;

        if (this.isScrollX) {
            const scrollBoxAlignSelfValue = alignSelf?.split(' ').find(v => scrollBoxVerticalActionMap[v]);
            if (scrollBoxAlignSelfValue) {
                scrollBoxVerticalActionMap[scrollBoxAlignSelfValue](scrollBoxSlot);
            } else {
                const alignItems = this.containerStyle?.alignItems || 'stretch';
                const scrollBoxAlignItemsValue = alignItems?.split(' ').find(v => scrollBoxVerticalActionMap[v]);
                scrollBoxVerticalActionMap[scrollBoxAlignItemsValue](scrollBoxSlot);
            }
        } else {
            const value = alignSelf?.split(' ').find(v => scrollBoxHorizontalActionMap[v]);
            if (value) {
                scrollBoxHorizontalActionMap[value](scrollBoxSlot);
            } else {
                const alignItems = this.containerStyle?.alignItems || 'stretch';
                const value = alignItems?.split(' ').find(v => scrollBoxHorizontalActionMap[v]);
                scrollBoxHorizontalActionMap[value](scrollBoxSlot);
            }
        }
    }
    
    private initScrollBoxSlot(scrollBox: UE.ScrollBox, Slot: UE.PanelSlot, childProps: any) {
        const childStyle = mergeClassStyleAndInlineStyle(childProps);
        this.setupAlignment(Slot, childStyle);
        let margin = convertMargin(childStyle.margin, this.containerStyle); 
        (Slot as any).SetPadding(margin);
    }

    override convertToWidget(): UE.Widget {
        this.containerStyle = mergeClassStyleAndInlineStyle(this.props);
        const overflow = this.containerStyle?.overflow;
        const flexDirection = this.containerStyle?.flexDirection || 'column';
        
        this.isScrollX = this.containerStyle?.overflowX === 'scroll' 
                            || this.containerStyle?.overflowX === 'auto'
                            || flexDirection === 'row';

        const scrollBox = new UE.ScrollBox();
        this.setupScrollBox(scrollBox);
        if (overflow === 'hidden' || overflow === 'clip') {
            scrollBox.SetClipping(UE.EWidgetClipping.ClipToBounds);
        }
        return scrollBox;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        return true;
    }

    override appendChildItem(parentItem: UE.Widget, childItem: UE.Widget, childItemTypeName: string, childProps?: any): void {
        let scrollBox = parentItem as UE.ScrollBox;
        let scrollBoxSlot = scrollBox.AddChild(childItem);
        this.initScrollBoxSlot(scrollBox, scrollBoxSlot, childProps);
    }
}
