
export function getStylesFromClassSelector(className: string): Record<string, any> {
    if (!className) {
        return {};
    }

    let classNameStyles = {};
    if (className) {
        // Split multiple classes
        const classNames = className.split(' ');
        for (const className of classNames) {
            // Get styles associated with this class name
            const classStyle = convertCssToStyles(getCssStyleForClass(className));
            if (classStyle) {
                // Merge the class styles into our style object
                classNameStyles = { ...classNameStyles, ...classStyle };
            }
        }
    }

    return classNameStyles;
}

export function getStyleFromIdSelector(id: string): Record<string, any> {
    if (!id) {
        return {};
    }

    const idStyle = convertCssToStyles(getCssStyleForClass(id));
    return idStyle;
}

export function getStyleFromTypeSelector(type: string): Record<string, any> {
    if (!type) {
        return {};
    }

    const typeStyle = convertCssToStyles(getCssStyleForClass(type));
    return typeStyle;
}

/**
 * 从props中获取所有渠道定义的样式
 * @param props 
 * @returns 
 */
export function getAllStyles(type: string, props: any): Record<string, any> {
    if (!props) {
        return {};
    }

    // get all the styles from css selector and jsx style
    const classNameStyles = getStylesFromClassSelector(props?.className);
    const idStyle = getStyleFromIdSelector(props?.id);
    const typeStyle = getStyleFromTypeSelector(type);
    const inlineStyles = props?.style;
    // When merging styles, properties from objects later in the spread order
    // will override properties from earlier objects if they have the same key.
    // This follows CSS specificity rules where:
    // 1. Type selectors (element) have lowest priority
    // 2. Class selectors have higher priority than type selectors
    // 3. ID selectors have higher priority than class selectors
    // 4. Inline styles have the highest priority
    //
    // So the order of precedence (from lowest to highest) is:
    // typeStyle < classNameStyles < idStyle < inlineStyles
    return { ...classNameStyles, ...idStyle, ...typeStyle, ...inlineStyles };
}

/**
 * 将CSS样式的字符串格式转换为JSX样式对象
 * @param css 
 * @returns 
 */
export function convertCssToStyles(css: string): Record<string, any> {
    // Parse the CSS string
    const styles: Record<string, any> = {};
    
    // Handle empty or invalid input
    if (!css || typeof css !== 'string') {
        return styles;
    }
    
    // Remove curly braces if they exist
    let cleanCss = css.trim();
    if (cleanCss.startsWith('{') && cleanCss.endsWith('}')) {
        cleanCss = cleanCss.substring(1, cleanCss.length - 1).trim();
    }
    
    // Split by semicolons to get individual declarations
    const declarations = cleanCss.split(';').filter(decl => decl.trim() !== '');
    
    for (const declaration of declarations) {
        // Split each declaration into property and value
        const [property, value] = declaration.split(':').map(part => part.trim());
        
        if (property && value) {
            // Convert kebab-case to camelCase
            const camelCaseProperty = property.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
            
            // Add to styles object
            styles[camelCaseProperty] = value;
        }
    }

    return styles;
}