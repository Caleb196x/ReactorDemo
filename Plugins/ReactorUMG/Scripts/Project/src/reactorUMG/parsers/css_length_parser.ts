import * as UE from "ue";

/**
 * Converts CSS length values to SU (Slate Units) for Unreal Engine UMG
 * Supported units: px, %, em, rem (relative to parent font size)
 * @param length - CSS length string to convert (e.g., "16px", "2em")
 * @param style - React style object containing font size reference
 * @returns Converted value in SU units
 */
export function convertLengthUnitToSlateUnit(length: string, style: any): number {
    // get font size of parent
    let fontSize = style?.fontSize || '16px';
    if (!fontSize.endsWith('px')) {
        fontSize = '16px';
    }

    const numSize = parseInt(fontSize.replace('px', '')); 
    if (length.endsWith('px')) {
        const match = length.match(/([+-]?\d+)px/);
        if (match) {
            return parseInt(match[1]); 
        }
    } else if (length.endsWith('%')) {
        // todo@Caleb196x: 需要获取父元素的值
    } else if (length.endsWith('em')) {
        const match = length.match(/(\d+)em/);
        if (match) {
            return parseInt(match[1]) * numSize;
        }
    } else if (length.endsWith('rem')) {
        const match = length.match(/(\d+)rem/);
        if (match) {
            return parseInt(match[1]) * numSize;
        }
    } else if (length === 'thin') {
        return 12;
    } else if (length === 'medium') {
        return 16;
    } else if (length === 'normal') {
        return 16;
    } else if (length === 'thick') {
        return 20;
    } 
    else if (!isNaN(parseFloat(length))) {
        // If it's just a number without units, return it directly
        return parseFloat(length);
    }

    return 0; 
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