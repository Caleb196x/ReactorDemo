import { ComponentWrapper } from "../common_wrapper";
import * as UE from "ue";
import { UMGContainerType } from "./container";
import { convertGap, convertMargin, mergeClassStyleAndInlineStyle } from "../common_utils";

export class FlexWrapper extends ComponentWrapper {
    private containerStyle: any;
    private flexDirection: string; 
    private containerType: UMGContainerType;
    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
        this.containerType = UMGContainerType.HorizontalBox;
    }
    
    override convertToWidget(): UE.Widget { 
        this.containerStyle = mergeClassStyleAndInlineStyle(this.props);

        let flexDirection = this.containerStyle?.flexDirection;
        const flexFlow = this.containerStyle?.flexFlow;
        if (flexFlow) {
            const flexFlowArray = flexFlow.split(' ');
            if (flexFlowArray.length === 2) {
                flexDirection = flexFlowArray[0];
            }
        } else if (!flexDirection) {
            flexDirection = 'row'; // 默认值
        }

        this.flexDirection = flexDirection;
        const reverse = flexDirection === 'row-reverse' || flexDirection === 'column-reverse';

        let widget: UE.Widget;
        // Convert to appropriate UMG container based on style
        if (flexDirection === 'row' || flexDirection === 'row-reverse') {
            widget = new UE.HorizontalBox();

            this.containerType = UMGContainerType.HorizontalBox;
        } else if (flexDirection === 'column' || flexDirection === 'column-reverse') {
            widget = new UE.VerticalBox();
            this.containerType = UMGContainerType.VerticalBox;
        }

        if (reverse) {
            widget.FlowDirectionPreference = UE.EFlowDirectionPreference.RightToLeft;
        }

        return widget;
    }
    private setupAlignment(Slot: UE.PanelSlot, childStyle: any) {
        const style = this.containerStyle || {};
        const justifyContent = style?.justifyContent || 'flex-start';
        const alignItems = style?.alignItems || 'stretch';
        const rowReverse = this.flexDirection === 'row-reverse';

        const flexValue = childStyle?.flex || 1;
        const alignSelf = childStyle?.alignSelf;
        const justifySelf = childStyle?.justifySelf;

        if (this.containerType === UMGContainerType.HorizontalBox) {
            this.setupHorizontalBoxAlignment(Slot as UE.HorizontalBoxSlot, {
                justifyContent,
                alignItems,
                justifySelf,
                alignSelf,
                flexValue,
                rowReverse
            });
        } else if (this.containerType === UMGContainerType.VerticalBox) {
            this.setupVerticalBoxAlignment(Slot as UE.VerticalBoxSlot, {
                justifyContent,
                alignItems,
                justifySelf,
                alignSelf,
                flexValue,
                rowReverse
            });
        }
    }

    private setupHorizontalBoxAlignment(horizontalBoxSlot: UE.HorizontalBoxSlot, options: {
        justifyContent: string,
        alignItems: string,
        justifySelf: string,
        alignSelf: string,
        flexValue: number,
        rowReverse: boolean
    }) {
        const alignmentActions = this.getHorizontalBoxAlignmentActions(options.rowReverse);

        if (options.justifyContent?.includes('space-between')) {
            alignmentActions.spaceBetween(horizontalBoxSlot);
        }

        // Handle alignSelf or alignItems
        const alignSelfValue = options.alignSelf?.split(' ').find(v => alignmentActions.alignSelf[v]);
        if (alignSelfValue) {
            alignmentActions.alignSelf[alignSelfValue](horizontalBoxSlot);
        } else {
            const alignItemsValue = options.alignItems?.split(' ').find(v => alignmentActions.alignSelf[v]);
            if (alignItemsValue) {
                alignmentActions.alignSelf[alignItemsValue](horizontalBoxSlot);
            }
        }

        // Handle justifySelf or justifyContent
        const justifySelfValue = options.justifySelf?.split(' ').find(v => alignmentActions.justifySelf[v]);
        if (justifySelfValue) {
            alignmentActions.justifySelf[justifySelfValue](horizontalBoxSlot);
        } else {
            const justifyContentValue = options.justifyContent?.split(' ').find(v => alignmentActions.justifySelf[v]);
            if (justifyContentValue) {
                alignmentActions.justifySelf[justifyContentValue](horizontalBoxSlot);
            }
        }
    }

    private setupVerticalBoxAlignment(verticalBoxSlot: UE.VerticalBoxSlot, options: {
        justifyContent: string,
        alignItems: string,
        justifySelf: string,
        alignSelf: string,
        flexValue: number,
        rowReverse: boolean
    }) {
        const alignmentActions = this.getVerticalBoxAlignmentActions(options.rowReverse);

        if (options.justifyContent?.includes('space-between')) {
            alignmentActions.spaceBetween(verticalBoxSlot);
        }

        // Handle alignSelf or alignItems
        const alignSelfValue = options.alignSelf?.split(' ').find(v => alignmentActions.alignSelf[v]);
        if (alignSelfValue) {
            alignmentActions.alignSelf[alignSelfValue](verticalBoxSlot);
        } else {
            const alignItemsValue = options.alignItems?.split(' ').find(v => alignmentActions.alignSelf[v]);
            if (alignItemsValue) {
                alignmentActions.alignSelf[alignItemsValue](verticalBoxSlot);
            }
        }

        // Handle justifySelf or justifyContent
        const justifySelfValue = options.justifySelf?.split(' ').find(v => alignmentActions.justifySelf[v]);
        if (justifySelfValue) {
            alignmentActions.justifySelf[justifySelfValue](verticalBoxSlot);
        } else {
            const justifyContentValue = options.justifyContent?.split(' ').find(v => alignmentActions.justifySelf[v]);
            if (justifyContentValue) {
                alignmentActions.justifySelf[justifyContentValue](verticalBoxSlot);
            }
        }
    }

    private getHorizontalBoxAlignmentActions(rowReverse: boolean) {
        return {
            justifySelf: {
                'flex-start': (slot: UE.HorizontalBoxSlot) => 
                    slot.SetHorizontalAlignment(rowReverse ? UE.EHorizontalAlignment.HAlign_Right : UE.EHorizontalAlignment.HAlign_Left),
                'flex-end': (slot: UE.HorizontalBoxSlot) => 
                    slot.SetHorizontalAlignment(rowReverse ? UE.EHorizontalAlignment.HAlign_Left : UE.EHorizontalAlignment.HAlign_Right),
                'left': (slot: UE.HorizontalBoxSlot) => 
                    slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Left),
                'right': (slot: UE.HorizontalBoxSlot) => 
                    slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Right),
                'start': (slot: UE.HorizontalBoxSlot) => 
                    slot.SetHorizontalAlignment(rowReverse ? UE.EHorizontalAlignment.HAlign_Right : UE.EHorizontalAlignment.HAlign_Left),
                'end': (slot: UE.HorizontalBoxSlot) => 
                    slot.SetHorizontalAlignment(rowReverse ? UE.EHorizontalAlignment.HAlign_Left : UE.EHorizontalAlignment.HAlign_Right),
                'center': (slot: UE.HorizontalBoxSlot) => 
                    slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Center),
                'stretch': (slot: UE.HorizontalBoxSlot) => 
                    slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Fill)
            },
            alignSelf: {
                'stretch': (slot: UE.HorizontalBoxSlot) => 
                    slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Fill),
                'center': (slot: UE.HorizontalBoxSlot) => 
                    slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Center),
                'flex-start': (slot: UE.HorizontalBoxSlot) => 
                    slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Top),
                'flex-end': (slot: UE.HorizontalBoxSlot) => 
                    slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Bottom),
                'start': (slot: UE.HorizontalBoxSlot) => 
                    slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Top),
                'end': (slot: UE.HorizontalBoxSlot) => 
                    slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Bottom),
                'top': (slot: UE.HorizontalBoxSlot) => 
                    slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Top),
                'bottom': (slot: UE.HorizontalBoxSlot) => 
                    slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Bottom)
            },
            spaceBetween: (slot: UE.HorizontalBoxSlot) => 
                slot.SetSize(new UE.SlateChildSize(1, UE.ESlateSizeRule.Fill))
        };
    }

    private getVerticalBoxAlignmentActions(rowReverse: boolean) {
        return {
            justifySelf: {
                'flex-start': (slot: UE.VerticalBoxSlot) => 
                    slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Top),
                'flex-end': (slot: UE.VerticalBoxSlot) => 
                    slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Bottom),
                'start': (slot: UE.VerticalBoxSlot) => 
                    slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Top),
                'end': (slot: UE.VerticalBoxSlot) => 
                    slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Bottom),
                'left': (slot: UE.VerticalBoxSlot) => 
                    slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Top),
                'right': (slot: UE.VerticalBoxSlot) => 
                    slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Bottom),
                'center': (slot: UE.VerticalBoxSlot) => 
                    slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Center),
                'stretch': (slot: UE.VerticalBoxSlot) => 
                    slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Fill)
            },
            alignSelf: {
                'stretch': (slot: UE.VerticalBoxSlot) => 
                    slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Fill),
                'center': (slot: UE.VerticalBoxSlot) => 
                    slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Center),
                'flex-start': (slot: UE.VerticalBoxSlot) => 
                    slot.SetHorizontalAlignment(rowReverse ? UE.EHorizontalAlignment.HAlign_Right : UE.EHorizontalAlignment.HAlign_Left),
                'flex-end': (slot: UE.VerticalBoxSlot) => 
                    slot.SetHorizontalAlignment(rowReverse ? UE.EHorizontalAlignment.HAlign_Left : UE.EHorizontalAlignment.HAlign_Right),
                'start': (slot: UE.VerticalBoxSlot) => 
                    slot.SetHorizontalAlignment(rowReverse ? UE.EHorizontalAlignment.HAlign_Right : UE.EHorizontalAlignment.HAlign_Left),
                'end': (slot: UE.VerticalBoxSlot) => 
                    slot.SetHorizontalAlignment(rowReverse ? UE.EHorizontalAlignment.HAlign_Left : UE.EHorizontalAlignment.HAlign_Right),
                'top': (slot: UE.VerticalBoxSlot) => 
                    slot.SetHorizontalAlignment(rowReverse ? UE.EHorizontalAlignment.HAlign_Right : UE.EHorizontalAlignment.HAlign_Left),
                'bottom': (slot: UE.VerticalBoxSlot) => 
                    slot.SetHorizontalAlignment(rowReverse ? UE.EHorizontalAlignment.HAlign_Left : UE.EHorizontalAlignment.HAlign_Right)
            },
            spaceBetween: (slot: UE.VerticalBoxSlot) => 
                slot.SetSize(new UE.SlateChildSize(1, UE.ESlateSizeRule.Fill))
        };
    }

    private initSlot(Slot: UE.PanelSlot, childProps: any) {
        const childStyle = mergeClassStyleAndInlineStyle(childProps);
        this.setupAlignment(Slot, childStyle);

        // 对于容器来说，读取margin值
        let margin = convertMargin(childStyle?.margin, this.containerStyle);
        if (margin) {
            (Slot as any).SetPadding(margin);
        }
        
        let padding = convertMargin(childStyle?.padding, this.containerStyle);
        if (padding) {
            (Slot as any).SetPadding(padding);
        }
    }

    override appendChildItem(parentItem: UE.Widget, childItem: UE.Widget, childItemTypeName: string, childProps?: any): void {

        if (this.containerType === UMGContainerType.HorizontalBox) {
            const horizontalBox = parentItem as UE.HorizontalBox;
            let horizontalBoxSlot = horizontalBox.AddChildToHorizontalBox(childItem);
            this.initSlot(horizontalBoxSlot, childProps);
        } else if (this.containerType === UMGContainerType.VerticalBox) {
            const verticalBox = parentItem as UE.VerticalBox;
            let verticalBoxSlot = verticalBox.AddChildToVerticalBox(childItem);
            this.initSlot(verticalBoxSlot, childProps);
        } else if (this.containerType === UMGContainerType.StackBox) {
            const stackBox = parentItem as UE.StackBox;
            let stackBoxSlot = stackBox.AddChildToStackBox(childItem);
            this.initSlot(stackBoxSlot, childProps);
        }
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps : any, newProps: any, updateProps: Record<string, any>) : boolean {
        return;
    }
}
