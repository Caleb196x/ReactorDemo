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

        let rowReverse = this.flexDirection === 'row-reverse';

        const flexValue = childStyle?.flex || 1;
        const alignSelf = childStyle?.alignSelf;
        const justifySelf = childStyle?.justifySelf;

        // Set horizontal alignment based on justifyContent
        const hStartHorizontalAlignmentFunc = (horizontalBoxSlot: UE.HorizontalBoxSlot) => {
            horizontalBoxSlot.SetHorizontalAlignment(rowReverse ? UE.EHorizontalAlignment.HAlign_Right : UE.EHorizontalAlignment.HAlign_Left);
        };
        const hEndHorizontalAlignmentFunc = (horizontalBoxSlot: UE.HorizontalBoxSlot) => {
            horizontalBoxSlot.SetHorizontalAlignment(rowReverse ? UE.EHorizontalAlignment.HAlign_Left : UE.EHorizontalAlignment.HAlign_Right);
        };
        const hCenterHorizontalAlignmentFunc = (horizontalBoxSlot: UE.HorizontalBoxSlot) => {
            horizontalBoxSlot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Center);
        };
        const hStretchHorizontalAlignmentFunc = (horizontalBoxSlot: UE.HorizontalBoxSlot) => {
            horizontalBoxSlot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Fill);
        };
        const hSpaceBetweenSetAlginFunc = (horizontalBoxSlot: UE.HorizontalBoxSlot) => {
            horizontalBoxSlot.SetSize(new UE.SlateChildSize(flexValue, UE.ESlateSizeRule.Fill));
        };

        const hJustifySelfActionMap = {
            'flex-start': hStartHorizontalAlignmentFunc,
            'flex-end': hEndHorizontalAlignmentFunc,
            'left': hStartHorizontalAlignmentFunc,
            'right': hEndHorizontalAlignmentFunc,
            'start': hStartHorizontalAlignmentFunc,
            'end': hEndHorizontalAlignmentFunc,
            'center': hCenterHorizontalAlignmentFunc,
            'stretch': hStretchHorizontalAlignmentFunc,
        };

        const hStartSetVerticalAlignmentFunc = (horizontalBoxSlot: UE.HorizontalBoxSlot) => {
            horizontalBoxSlot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Top);
        };

        const hEndSetVerticalAlignmentFunc = (horizontalBoxSlot: UE.HorizontalBoxSlot) => {
            horizontalBoxSlot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Bottom);
        };

        const hCenterSetVerticalAlignmentFunc = (horizontalBoxSlot: UE.HorizontalBoxSlot) => {
            horizontalBoxSlot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Center);
        };

        const hStretchSetVerticalAlignmentFunc = (horizontalBoxSlot: UE.HorizontalBoxSlot) => {
            horizontalBoxSlot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Fill);
        };

        const hAlignSelfActionMap = {
            'stretch': hStretchSetVerticalAlignmentFunc,
            'center': hCenterSetVerticalAlignmentFunc,
            'flex-start': hStartSetVerticalAlignmentFunc,
            'flex-end': hEndSetVerticalAlignmentFunc,
            'start': hStartSetVerticalAlignmentFunc,
            'end': hEndSetVerticalAlignmentFunc,
            'top': hStartSetVerticalAlignmentFunc,
            'bottom': hEndSetVerticalAlignmentFunc
        }

        const vSpaceBetweenSetAlginFunc = (verticalBoxSlot: UE.VerticalBoxSlot) => {
            verticalBoxSlot.SetSize(new UE.SlateChildSize(flexValue, UE.ESlateSizeRule.Fill));
        };

        const vStartVerticalAlignmentFunc = (verticalBoxSlot: UE.VerticalBoxSlot) => {
            verticalBoxSlot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Top);
        };

        const vEndVerticalAlignmentFunc = (verticalBoxSlot: UE.VerticalBoxSlot) => {
            verticalBoxSlot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Bottom);
        };

        const vCenterVerticalAlignmentFunc = (verticalBoxSlot: UE.VerticalBoxSlot) => {
            verticalBoxSlot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Center);
        };

        const vStretchVerticalAlignmentFunc = (verticalBoxSlot: UE.VerticalBoxSlot) => {
            verticalBoxSlot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Fill);
        };

        const vJustifySelfActionMap = {
            'flex-start': vStartVerticalAlignmentFunc,
            'flex-end': vEndVerticalAlignmentFunc,
            'start': vStartVerticalAlignmentFunc,
            'end': vEndVerticalAlignmentFunc,
            'left': vStartVerticalAlignmentFunc,
            'right': vEndVerticalAlignmentFunc,
            'center': vCenterVerticalAlignmentFunc,
            'stretch': vStretchVerticalAlignmentFunc,
            'space-between': vSpaceBetweenSetAlginFunc
        };
        
        const vStartSetHorizontalAlignmentFunc = (verticalBoxSlot: UE.VerticalBoxSlot) => {
            verticalBoxSlot.SetHorizontalAlignment(rowReverse ? UE.EHorizontalAlignment.HAlign_Right : UE.EHorizontalAlignment.HAlign_Left);
        };

        const vEndSetHorizontalAlignmentFunc = (verticalBoxSlot: UE.VerticalBoxSlot) => {
            verticalBoxSlot.SetHorizontalAlignment(rowReverse ? UE.EHorizontalAlignment.HAlign_Left : UE.EHorizontalAlignment.HAlign_Right);
        };

        const vCenterSetHorizontalAlignmentFunc = (verticalBoxSlot: UE.VerticalBoxSlot) => {
            verticalBoxSlot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Center);
        };

        const vStretchSetHorizontalAlignmentFunc = (verticalBoxSlot: UE.VerticalBoxSlot) => {
            verticalBoxSlot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Fill);
        };

        const vAlignSelfActionMap = {
            'stretch': vStretchSetHorizontalAlignmentFunc,
            'center': vCenterSetHorizontalAlignmentFunc,
            'flex-start': vStartSetHorizontalAlignmentFunc,
            'flex-end': vEndSetHorizontalAlignmentFunc,
            'start': vStartSetHorizontalAlignmentFunc,
            'end': vEndSetHorizontalAlignmentFunc,
            'top': vStartSetHorizontalAlignmentFunc,
            'bottom': vEndSetHorizontalAlignmentFunc
        }

        if (this.containerType === UMGContainerType.HorizontalBox) {
            const horizontalBoxSlot = Slot as UE.HorizontalBoxSlot;

            if (justifyContent?.includes('space-between')) {
                hSpaceBetweenSetAlginFunc(horizontalBoxSlot);
            }

            const hAlignSelfValue = alignSelf?.split(' ').find(v => hAlignSelfActionMap[v]);
            if (hAlignSelfValue) {
                hAlignSelfActionMap[hAlignSelfValue](horizontalBoxSlot);
            } else {
                const hAlignItems = alignItems?.split(' ').find(v => hAlignSelfActionMap[v]);
                if (hAlignItems) {
                    hAlignSelfActionMap[hAlignItems](horizontalBoxSlot);
                }
            }

            const hJustifySelfValue = justifySelf?.split(' ').find(v => hJustifySelfActionMap[v]);
            if (hJustifySelfValue) {
                hJustifySelfActionMap[hJustifySelfValue](horizontalBoxSlot);
            } else {
                const hJustifyItems = justifyContent?.split(' ').find(v => hJustifySelfActionMap[v]);
                if (hJustifyItems) {
                    hJustifySelfActionMap[hJustifyItems](horizontalBoxSlot);
                }
            }

        } else if (this.containerType === UMGContainerType.VerticalBox) {
            const verticalBoxSlot = Slot as UE.VerticalBoxSlot;

            if (justifyContent?.includes('space-between')) {
                vSpaceBetweenSetAlginFunc(verticalBoxSlot);
            }

            const vAlignSelfValue = alignSelf?.split(' ').find(v => vAlignSelfActionMap[v]);
            if (vAlignSelfValue) {
                vAlignSelfActionMap[vAlignSelfValue](verticalBoxSlot);
            } else {
                const vAlignItems = alignItems?.split(' ').find(v => vAlignSelfActionMap[v]);
                if (vAlignItems) {
                    vAlignSelfActionMap[vAlignItems](verticalBoxSlot);
                }
            }

            const vJustifySelfValue = justifySelf?.split(' ').find(v => vJustifySelfActionMap[v]);
            if (vJustifySelfValue) {
                vJustifySelfActionMap[vJustifySelfValue](verticalBoxSlot);
            } else {
                const vJustifyItems = justifyContent?.split(' ').find(v => vJustifySelfActionMap[v]);
                if (vJustifyItems) {
                    vJustifySelfActionMap[vJustifyItems](verticalBoxSlot);
                }
            }
        }
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
