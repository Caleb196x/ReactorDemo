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

export function parseScale(scale: string) : UE.Vector2D {
    if (!scale || scale === 'none') {
        return new UE.Vector2D(1, 1);
    }

    const scaleValues = scale.split(' ').map(Number);
    if (scaleValues.length === 1) {
        return new UE.Vector2D(scaleValues[0], scaleValues[0]);
    } else if (scaleValues.length === 2) {
        return new UE.Vector2D(scaleValues[0], scaleValues[1]);
    }

    return new UE.Vector2D(1, 1);
}