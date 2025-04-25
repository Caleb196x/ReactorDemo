import * as UE from "ue";
import { convertLengthUnitToSlateUnit } from "./css_length_parser";

/**
 * Expands padding values into umg padding values from css padding values
 * @param paddingValues 
 * @returns umg padding values
 */
export function expandPaddingValues(paddingValues: number[]): number[] {
    if (paddingValues.length === 2) {
        return [paddingValues[0], paddingValues[1], paddingValues[0], paddingValues[1]];
    } else if (paddingValues.length === 1) {
        return [paddingValues[0], paddingValues[0], paddingValues[0], paddingValues[0]];
    } else if (paddingValues.length === 3) {
        // padding: top right bottom
        return [paddingValues[0], paddingValues[1], paddingValues[2], paddingValues[1]];
    }

    return paddingValues;
}

export function convertMargin(margin: string, style: any): UE.Margin | undefined {
    if (!margin) {
        return undefined;
    }

    const marginValues = margin.split(' ').map(v => {
        // todo@Caleb196x: 处理margin的单位
        v = v.trim();
        return convertLengthUnitToSlateUnit(v, style);
    });

    let expandedMarginValues = expandPaddingValues(marginValues);

    // React Padding: top right bottom left
    // UMG Padding: Left, Top, Right, Bottom
    return new UE.Margin(expandedMarginValues[3], expandedMarginValues[0], expandedMarginValues[1], expandedMarginValues[2]);
}

export function convertGap(gap: string, style: any): UE.Vector2D {
    if (!gap) {
        return new UE.Vector2D(0, 0);
    }
    const gapValues = gap.split(' ').map(v => {
        // todo@Caleb196x: 处理react的单位
        v = v.trim();
        return convertLengthUnitToSlateUnit(v, style);
    });

    if (gapValues.length === 2) {
        // gap: row column
        // innerSlotPadding: x(column) y(row)
        return new UE.Vector2D(gapValues[1], gapValues[0]);
    }

    return new UE.Vector2D(gapValues[0], gapValues[0]);
}
