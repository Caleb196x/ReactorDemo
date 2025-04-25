import { convertCssToStyles } from '../css_converter';
import * as UE from 'ue';
import { parseColor } from './parser/color_parser';
import { parseBackgroundPosition } from './parser/background_parser';
import * as CssType from 'csstype';

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

export function mergeClassStyleAndInlineStyle(props: any) {
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

export function loadTextureFromImagePath(imagePath: string) : UE.Texture2D | undefined {
    // todo@Caleb196x: 定制化导入函数，传入参数为相对于Content/JavaScript的绝对路径名，提高导入性能
    const texture = UE.KismetRenderingLibrary.ImportFileAsTexture2D(null, imagePath);
    if (texture) {
        return texture;
    } else {
        console.warn(`Failed to load texture from image path: ${imagePath}`);
    }
    return undefined;
}

export function parseBackgroundImage(backgroundImage: string, backgroundSize: string) : UE.SlateBrush | undefined {
    let brush = new UE.SlateBrush();
    brush.DrawAs = UE.ESlateBrushDrawType.Image;
    if (!backgroundImage) {
        return brush;
    }

    if (typeof backgroundImage !== 'string') {
        brush.ResourceObject = backgroundImage as UE.Texture2D;
        return brush;
    }

    let imagePath = backgroundImage;

    // Handle template literal with imported texture
    const templateMatch = backgroundImage.match(/`url\(\${(.*?)}\)`/);
    if (templateMatch && templateMatch[1]) {
        const textureName = templateMatch[1].trim();
        imagePath = textureName;
    }

    // Handle url() format if present
    const urlMatch = backgroundImage.match(/url\((.*?)\)/);
    if (urlMatch && urlMatch[1]) {
        imagePath = urlMatch[1].trim();
        // Remove quotes if present
        imagePath = imagePath.replace(/['"]/g, '');
    }
    // If not url() format, use the path directly
    else {
        imagePath = backgroundImage.trim();
        imagePath = imagePath.replace(/['"]/g, ''); // Still remove quotes if any
    }

    // Basic path validation
    if (!imagePath || imagePath.length === 0) {
        return null;
    }

    // Check for invalid characters in path
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(imagePath)) {
        console.warn(`Invalid characters in image path: ${imagePath}`);
        return null;
    }

    // Check file extension
    const validExtensions = ['.png', '.jpg', '.jpeg', '.bmp', '.tga'];
    const hasValidExtension = validExtensions.some(ext => 
        imagePath.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension) {
        console.warn(`Invalid image file extension: ${imagePath}`);
        return null;
    }

    // Check if file exists
    const texture = loadTextureFromImagePath(imagePath);
    if (!texture) {
        console.warn(`Failed to load texture from image path: ${imagePath}`);
    } else {
        brush.ResourceObject = texture;
    }

    // parse backgroundSize
    if (backgroundSize) {
        const sizeValues = backgroundSize.split(' ');
        if (sizeValues.length === 1) {
            if (sizeValues[0] === 'cover' || sizeValues[0] === 'auto') {
                brush.Tiling = UE.ESlateBrushTileType.NoTile;
            } else if (sizeValues[0] === 'contain') {
                brush.Tiling = UE.ESlateBrushTileType.Both;
            } else {
                brush.ImageSize.X = Number(sizeValues[0]);
                brush.ImageSize.Y = Number(sizeValues[0]);
            }
        } else if (sizeValues.length === 2) {
            brush.Tiling = UE.ESlateBrushTileType.Both;
            brush.ImageSize.X = Number(sizeValues[0]);
            brush.ImageSize.Y = Number(sizeValues[1]);
        }
    }

    return brush;
}

export function parseBackgroundColor(backgroundColor: string) : UE.LinearColor {
    const color = parseColor(backgroundColor);
    return new UE.LinearColor(color.r / 255.0, color.g / 255.0, color.b / 255.0, color.a);
}

export function parseBackgroundRepeat(backgroundRepeat: string, image: UE.SlateBrush) : UE.SlateBrush {
    if (!image) {
        return image;
    }

    if (backgroundRepeat === 'no-repeat') {
        image.Tiling = UE.ESlateBrushTileType.NoTile;
    } else if (backgroundRepeat === 'repeat') {
        image.Tiling = UE.ESlateBrushTileType.Both;
    } else if (backgroundRepeat === 'repeat-x') {
        image.Tiling = UE.ESlateBrushTileType.Horizontal;
    } else if (backgroundRepeat === 'repeat-y') {
        image.Tiling = UE.ESlateBrushTileType.Vertical;
    }

    return image;
}

function parseBackgroundLayer(layer) {
    const REPEAT_KEYWORDS = {
        'repeat-x': 1, 'repeat-y': 1, 'repeat': 1,
        'space': 1, 'round': 1, 'no-repeat': 1
    };
      
    const ATTACHMENT_KEYWORDS = {
    'scroll': 1, 'fixed': 1, 'local': 1
    };
    
    const POSITION_KEYWORDS = new Set([
    'left', 'right', 'top', 'bottom', 'center'
    ]);

    const state = {
      color: 'none',
      image: 'none',
      position: 'none',
      size: 'none',
      repeat: 'none',
      attachment: 'scroll'
    };
  
    // 提取颜色（按规范应出现在最后）
    const colorMatch = layer.match(/(?:^|\s)(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*\d*\.?\d+)?\s*\)|hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(?:,\s*\d*\.?\d+)?\s*\)|\b[a-zA-Z]+\b)(?=\s*$)/);
    if (colorMatch) {
      state.color = colorMatch[1];
      layer = layer.slice(0, colorMatch.index).trim();
    }
  
    // 拆分 token（处理带空格的图片）
    const tokens = [];
    const regex = /(url\([^)]+\))/g;
    let match;
    while ((match = regex.exec(layer)) !== null) {
      tokens.push(match[1]);
    }
  
    // 解析其他属性
    let positionBuffer = [];
    let hasSlash = false;
  
    tokens.forEach(token => {
      if (token.startsWith('url(') || token.match(/^[\w-]+\(/)) {
        state.image = token;
      } else if (token === '/') {
        hasSlash = true;
      } else if (hasSlash) {
        state.size = token;
        hasSlash = false;
      } else if (token in REPEAT_KEYWORDS) {
        state.repeat = token;
      } else if (token in ATTACHMENT_KEYWORDS) {
        state.attachment = token;
      } else if (POSITION_KEYWORDS.has(token) || token.match(/^[\d%.]+$/)) {
        positionBuffer.push(token);
      }
    });
  
    // 处理位置/尺寸
    // fixme@Caleb196x: 解析的有点问题
    if (positionBuffer.length > 0) {
      const slashIndex = positionBuffer.indexOf('/');
      if (slashIndex > -1) {
        state.position = positionBuffer.slice(0, slashIndex).join(' ');
        state.size = positionBuffer.slice(slashIndex + 1).join(' ');
      } else {
        state.position = positionBuffer.join(' ');
      }
    }
  
    return state;
}

export function parseBackground(background: string) : any {
    // 1. 提取background中定义的background-color值
    // 2. 提取出background中定义的background-position值
    // 3. 提取出background中定义的background-repeat值
    // 4. 提取出background中定义的background-image值
    if (!background) {
        return {};
    }

    const { 
        color, 
        image, 
        position, 
        size, 
        repeat, 
        attachment 
    } = parseBackgroundLayer(background);

    let result = {};
    if (color !== 'none') {
        result['color'] = parseBackgroundColor(color);
    }

    if (image !== 'none') {
        result['image'] = parseBackgroundImage(image, size);
        result['repeat'] = parseBackgroundRepeat(repeat, result['image']);
    }

    if (position !== 'none') {
        result['position'] = parseBackgroundPosition(position);
    }

    return result;
}

export function parseChildAlignment(childStyle: any) {
    // 解析子元素在border中的对齐方式和padding
    let alignment = {
        horizontal: UE.EHorizontalAlignment.HAlign_Fill,
        vertical: UE.EVerticalAlignment.VAlign_Fill,
        padding: new UE.Margin(0, 0, 0, 0)
    }

    const childJustifySelf = childStyle?.justifySelf;
    if (childJustifySelf) {
        switch (childJustifySelf) {
            case 'start':
                alignment.horizontal = UE.EHorizontalAlignment.HAlign_Left;
                break;
            case 'end':
                alignment.horizontal = UE.EHorizontalAlignment.HAlign_Right;
                break;
            case 'center':
                alignment.horizontal = UE.EHorizontalAlignment.HAlign_Center;
                break;
            case 'stretch':
                alignment.horizontal = UE.EHorizontalAlignment.HAlign_Fill;
                break;
            case 'left':
                alignment.horizontal = UE.EHorizontalAlignment.HAlign_Left;
                break;
            case 'right':
                alignment.horizontal = UE.EHorizontalAlignment.HAlign_Right;
                break;
            default:

                alignment.horizontal = UE.EHorizontalAlignment.HAlign_Center;
                break;
        }
    }

    const childAlignSelf = childStyle?.alignSelf;
    if (childAlignSelf) {
        switch (childAlignSelf) {
            case 'start':
                alignment.vertical = UE.EVerticalAlignment.VAlign_Top;
                break;
            case 'end':
                alignment.vertical = UE.EVerticalAlignment.VAlign_Bottom;
                break;
            case 'center':
                alignment.vertical = UE.EVerticalAlignment.VAlign_Center;
                break;
            case 'stretch':
                alignment.vertical = UE.EVerticalAlignment.VAlign_Fill;
                break;
            case 'top':
                alignment.vertical = UE.EVerticalAlignment.VAlign_Top;
                break;
            case 'bottom':
                alignment.vertical = UE.EVerticalAlignment.VAlign_Bottom;
                break;
            default:
                alignment.vertical = UE.EVerticalAlignment.VAlign_Center;
                break;
        }
    }

    const childPadding = childStyle?.padding;
    if (childPadding) {
        alignment.padding = convertMargin(childPadding, childStyle);
    }

    const childMargin = childStyle?.margin;
    if (childMargin) {
        alignment.padding = convertMargin(childMargin, childStyle);
    }

    return alignment;
}

export function parseBackgroundProps(style: any, childStyle?: any): any {
    // image转换成brush image
    // repeat转换成image中的tiling模式
    // position转换成alignment和padding

    let result = {};
    const background = style?.background;
    if (background) {
        result = parseBackground(background);
    }

    const backgroundColor = style?.backgroundColor;
    if (backgroundColor) {
        result['color'] = parseBackgroundColor(backgroundColor);
    }

    const backgroundImage = style?.backgroundImage;
    const backgroundSize = style?.backgroundSize;
    if (backgroundImage) {
        result['image'] = parseBackgroundImage(backgroundImage, backgroundSize);
    }

    const backgroundRepeat = style?.backgroundRepeat;
    if (backgroundRepeat && result['image']) {
        result['image'] = parseBackgroundRepeat(backgroundRepeat, result['image']);
    }
    
    result['alignment'] = parseChildAlignment(childStyle);
    return result;
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

export function parseFontFamily(cssText) {
    const regex = /\s*:\s*([^;]+);?/i;
    const match = cssText.match(regex);
  
    if (!match) return [];
  
    const rawValue = match[1];
  
    // 使用正则处理带引号和不带引号的字体名
    const fonts = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
  
    for (let i = 0; i < rawValue.length; i++) {
      const char = rawValue[i];
  
      if ((char === '"' || char === "'")) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (quoteChar === char) {
          inQuotes = false;
        }
        continue;
      }
  
      if (char === ',' && !inQuotes) {
        fonts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  
    if (current.trim()) fonts.push(current.trim());
  
    return fonts.map(f => f.replace(/^["']|["']$/g, '').trim());
}