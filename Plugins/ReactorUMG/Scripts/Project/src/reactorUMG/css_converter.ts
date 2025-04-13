export function convertCssToStyles(css: string) {
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