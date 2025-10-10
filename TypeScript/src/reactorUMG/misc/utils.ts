import { convertCssToStyles } from "../parsers/cssstyle_parser";

export function isKeyOfRecord(key: any, record: Record<string, any>): key is keyof Record<string, any> {
    return key in record;
}

export function isEmpty(record: Record<string, any>): boolean {
    return Object.keys(record).length === 0;
}

export function mergeClassStyleWithInlineStyle(props: any) {
    if (!props) {
        return {};
    }

    let classNameStyles = {};
    if (props?.className) {
        // Split multiple classes
        const classNames = props.className.split(' ');
        for (const className of classNames) {
            // Get styles associated with this class name
            const classStyle = convertCssToStyles(getCssStyleForClass(className));
            // todo@Caleb196x: 解析classStyle
            if (classStyle) {
                // Merge the class styles into our style object
                classNameStyles = { ...classNameStyles, ...classStyle };
            }
        }
    }

    // Merge className styles with inline styles, giving precedence to inline styles
    const mergedStyle = { ...classNameStyles, ...(props?.style || {}) };
    return mergedStyle;
}


export function twoArraysEqual<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (typeof a[i] === 'object' && a[i] !== null && 
            typeof b[i] === 'object' && b[i] !== null) 
        {
            if (JSON.stringify(a[i]).trim() !== JSON.stringify(b[i]).trim()) 
                return false;
        } else if (Array.isArray(a[i]) && Array.isArray(b[i])) {
            if (!twoArraysEqual(a[i] as any[], b[i] as any[])) return false;
        } else if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

export function safeParseFloat(value: string | number) : number {
    if (typeof value === 'number') {
        return value;
    }

    if (typeof value === 'string') {
        const num = parseFloat(value);
        if (!isNaN(num)) {
            return num;
        }
    }

    return 0;
}

export function findChangedProps(oldProps: any, newProps: any): any {
    if (!oldProps) return newProps;
    if (!newProps) return {};
    
    const result: any = {};
    
    // Iterate through all keys in newProps
    for (const key in newProps) {
        // Skip if property doesn't exist in newProps
        if (!Object.prototype.hasOwnProperty.call(newProps, key)) continue;
        
        const oldValue = oldProps[key];
        const newValue = newProps[key];
        
        // If old value doesn't exist, add new value to result
        if (oldValue === undefined) {
            result[key] = newValue;
            continue;
        }
        
        // If both values are objects, recursively find changes
        if (typeof oldValue === 'object' && oldValue !== null && 
            typeof newValue === 'object' && newValue !== null) {
            const nestedChanges = findChangedProps(oldValue, newValue);
            
            // Only add to result if there are changes
            if (Object.keys(nestedChanges).length > 0) {
                result[key] = nestedChanges;
            }
        } 
        // Handle arrays - compare them by stringifying
        else if (Array.isArray(oldValue) && Array.isArray(newValue)) {
            // Compare arrays by stringifying them
            if (twoArraysEqual(oldValue, newValue)) {
                result[key] = newValue;
            }
        }
        // If values are different, add to result
        else if (oldValue !== newValue) {
            result[key] = newValue;
        }
    }
    
    return result;
}