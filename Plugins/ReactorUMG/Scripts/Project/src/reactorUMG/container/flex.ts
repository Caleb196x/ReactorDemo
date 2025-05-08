import * as UE from "ue";
import { ContainerConverter } from "./container_converter";
import { parseFlexHorizontalAlignmentActions, parseFlexVerticalAlignmentActions } from "../parsers/alignment_parser";
import { getAllStyles } from "../parsers/cssstyle_parser";

export class FlexConverter extends ContainerConverter {

    private isRow: boolean;
    private isReverse: boolean;
    constructor(typeName: string, props: any) {
        super(typeName, props);
        [this.isRow, this.isReverse] = this.parseFlexDirection();
    }

    private parseFlexDirection(): boolean[] {
        const style = this.containerStyle || {};
        let flexDirection = style.flexDirection;
        const flexFlow = style.flexFlow;

        // Check flexFlow first
        if (flexFlow) {
            const flexFlowArray = flexFlow.trim().split(' ');
            if (flexFlowArray.length >= 1) {
                flexDirection = flexFlowArray[0];
            }
        }

        // Default to 'row' if not specified
        if (!flexDirection) {
            flexDirection = 'row';
        }

        // Return [isRow, isReverse]
        return [
            flexDirection.trim().startsWith('row'),
            flexDirection.trim().endsWith('-reverse')
        ];
    }

    private setAlignmentUsingActions(slot: UE.PanelSlot, alignmentActions:any, childStyle: any) {
        const justifyContent = this.containerStyle?.justifyContent || '';
        const alignItems = this.containerStyle?.alignItems || '';
        const childJustifySelf = childStyle?.justifySelf || '';
        const childAlignSelf = childStyle?.alignSelf || '';

        if (justifyContent === 'space-between') {
            alignmentActions.spaceBetween(slot, childStyle?.flex ? childStyle.flex : 1);
        }

        
        // Handle alignSelf or alignItems
        const alignSelfValue = childAlignSelf?.split(' ').find(v => alignmentActions.alignSelf[v]);
        if (alignSelfValue) {
            alignmentActions.alignSelf[alignSelfValue](slot);
        } else {
            const alignItemsValue = alignItems.split(' ').find(v => alignmentActions.alignSelf[v]);
            if (alignItemsValue) {
                alignmentActions.alignSelf[alignItemsValue](slot);
            }
        }

        // Handle justifySelf or justifyContent
        const justifySelfValue = childJustifySelf?.split(' ').find(v => alignmentActions.justifySelf[v]);
        if (justifySelfValue) {
            alignmentActions.justifySelf[justifySelfValue](slot);
        } else {
            const justifyContentValue = justifyContent.split(' ').find(v => alignmentActions.justifySelf[v]);
            if (justifyContentValue) {
                alignmentActions.justifySelf[justifyContentValue](slot);
            }
        }
    }

    private initHorizontalBoxSlot(horizontalBoxSlot: UE.HorizontalBoxSlot, childStyle: any): void {
        const alignmentActions = parseFlexHorizontalAlignmentActions();
        this.setAlignmentUsingActions(horizontalBoxSlot, alignmentActions, childStyle);
    }

    private initVerticalBoxSlot(verticalBoxSlot: UE.VerticalBoxSlot, childStyle: any): void {
        const alignmentActions = parseFlexVerticalAlignmentActions();
        this.setAlignmentUsingActions(verticalBoxSlot, alignmentActions, childStyle);
    }

    createNativeWidget(): UE.Widget {
        const widget = this.isRow ? new UE.HorizontalBox() : new UE.VerticalBox();
        if (this.isReverse) {
            widget.FlowDirectionPreference = UE.EFlowDirectionPreference.RightToLeft;
            UE.UMGManager.SynchronizeWidgetProperties(widget);
        }

        return widget;
    }

    update(widget: UE.Widget, oldProps: any, changedProps: any): void {
        // do nothing in flex container
    }

    appendChild(parent: UE.Widget, child: UE.Widget, childTypeName: string, childProps: any): void {
        const childStyle = getAllStyles(childTypeName, childProps);
        if (this.isRow) {
            const horizontalBox = parent as UE.HorizontalBox;
            const horizontalBoxSlot = horizontalBox.AddChildToHorizontalBox(child);
            this.initHorizontalBoxSlot(horizontalBoxSlot, childStyle);
            super.initChildPadding(horizontalBoxSlot, childStyle);
        } else {
            const verticalBox = parent as UE.VerticalBox;
            const verticalBoxSlot = verticalBox.AddChildToVerticalBox(child);
            this.initVerticalBoxSlot(verticalBoxSlot, childStyle);
            super.initChildPadding(verticalBoxSlot, childStyle);
        }
    }
}
