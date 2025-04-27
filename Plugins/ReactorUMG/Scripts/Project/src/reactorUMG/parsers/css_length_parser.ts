import * as UE from "ue";
import { safeParseFloat } from "../misc/utils";

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

export function convertLUToSUWithUnitType(length: string, fontSize?: number): {type: string, value: number} {
    if (!fontSize) {
        fontSize = 16;
    }

    let result = { type: 'auto', value: 0 };
    if (length === 'auto') {
        return result;
    }

    if (length === 'thin') {
        return {type: 'px', value: 12};
    } else if (length === 'medium') {
        return {type: 'px', value: 16};
    } else if (length === 'normal') {
        return {type: 'px', value: 16};
    } else if (length === 'thick') {
        return {type: 'px', value: 20};
    } 
    else if (!isNaN(parseFloat(length))) {
        // If it's just a number without units, return it directly
        return {type: 'px', value: parseFloat(length)};
    }

    // Match numeric value and unit
    const match = length.match(/^(\d*\.?\d+)([a-z%]*)$/);
    if (match) {
        let numValue = safeParseFloat(match[1]);
        const unit = match[2] || 'px';
        
        if (unit === 'em' || unit === 'rem') {
            numValue = numValue * fontSize; // todo@Caleb196x: 读取font size，如果没有font size，则使用默认值16px
        }

        // todo@Caleb196x: 需要知道父控件的宽度和长度所占像素值，然后根据px值转换成占比值fr
        return { type: unit, value: numValue };
    }
    
    // Default fallback
    return { type: 'fr', value: 1 };
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

/**
 * Parses a string representing an aspect ratio and returns a number
 * @param aspectRatio - String representing aspect ratio (e.g., "16/9", "0.5", "1/1")
 * @returns Number representing aspect ratio (e.g., 1.7777777777777777)
 */
export function parseAspectRatio(aspectRatio: string) {
    if (!aspectRatio) {
        return 1.0;
    }

    // Handle decimal format like '0.5'
    if (!isNaN(Number(aspectRatio))) {
        return Number(aspectRatio);
    }

    // Handle ratio format like '16/9' or '1/1'
    const parts = aspectRatio.split('/');
    if (parts.length === 2) {
        const numerator = Number(parts[0]);
        const denominator = Number(parts[1]);
        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
            return numerator / denominator;
        }
    }

    return 1.0;
}
