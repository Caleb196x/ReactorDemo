import * as UE from 'ue';
import { ComponentWrapper } from "./common_wrapper";
import { convertMargin } from './common_utils';

export class UniformGridWrapper extends ComponentWrapper {
    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    override convertToWidget(): UE.Widget {
        const uniformGrid = new UE.UniformGridPanel();
        this.commonPropertyInitialized(uniformGrid);

        const minCellSize = this.props?.minCellSize;
        if (minCellSize) {
            uniformGrid.SetMinDesiredSlotWidth(minCellSize.x);
            uniformGrid.SetMinDesiredSlotHeight(minCellSize.y);
        }

        const cellPadding = this.props?.cellPadding;
        if (cellPadding) {
            let padding = null;
            if (typeof cellPadding === 'object') {
                padding = new UE.Margin(cellPadding.top, cellPadding.right, 
                                        cellPadding.bottom, cellPadding.left);

            } else if (typeof cellPadding === 'string') {
                padding = convertMargin(cellPadding, this.props?.style);
            }

            if (padding) {
                uniformGrid.SetSlotPadding(padding);
            }
        }

        return uniformGrid;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        const overlay = widget as UE.Overlay;
        let propsChange = false;

        return propsChange;
    }
}

