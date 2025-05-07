import { parseColor } from "./css_color_parser";
import { convertLengthUnitToSlateUnit } from "./css_length_parser";
import * as UE from 'ue';

export function parseFontSize(fontSize: any, style: any): number {
    if (typeof fontSize === 'string') {
        const fontSizeValue = convertLengthUnitToSlateUnit(fontSize, style);
        return fontSizeValue;
    } else if (typeof fontSize === 'number') {
        return fontSize <= 0 ? 12 : fontSize;
    } else {
        return 16;
    }
}

export function parseTextAlign(textAlign: string): UE.ETextJustify {
    return textAlign === 'center' ? UE.ETextJustify.Center : textAlign === 'right'
                                  ? UE.ETextJustify.Right : UE.ETextJustify.Left;
}

export function parseFontFaceName(fontStyle: string, fontWeight: string) {
    let fontFace = 'Default';
    if (fontWeight === 'bold' || fontWeight === 'bolder') {
        fontFace = 'Bold';
    } else if (fontWeight === 'light' || fontWeight === 'lighter') {
        fontFace = 'Light';
    } else if (fontWeight === 'normal') {
        fontFace = 'Default';
    }

    switch (fontStyle) {
        case 'italic':
            fontFace = fontFace == 'Bold' ? 'Bold Italic' : 'Italic';
        case 'blod italic':
            fontFace = 'Bold Italic';
        case 'normal':
            fontFace = 'Default';
        default:
            fontFace = fontStyle;
    }

    return fontFace;
}

export function parseFontSkewAmount(fontStyle: string): number {
    if (fontStyle.includes('oblique')) {
        const obliqueMatch = fontStyle.match(/oblique\s+(\d+)deg/);
        if (obliqueMatch && obliqueMatch[1]) {
            const angleDegrees = parseInt(obliqueMatch[1], 10);
            // Convert degrees to radians (UE uses radians for skew)
            const angleRadians = angleDegrees * (Math.PI / 180);
            return angleRadians;
        }
    }

    return 0;
}

export function parseFontFamily(cssText: string) {
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

export function parseOutline(outline: string, style: any) {
    // Parse outline with pattern: <width> || <style> || <color>
    const parts = outline.trim().split(/\s+/);
    const result: any = {};

    for (const part of parts) {
        if (part.match(/^(solid|dashed|dotted|double|groove|ridge|inset|outset|none)$/i)) {
            // Style
            result.style = part;
        } else if (part.match(/^(#|rgb|rgba|hsl|hsla|[a-z]+$)/i)) {
            // Color
            result.color = parseColor(part);
        } else {
            // Width - assume it's a length value
            result.width = convertLengthUnitToSlateUnit(part, style);
        }
    }

    // If only one value provided, assume it's the style
    if (parts.length === 1 && !result.width && !result.color) {
        result.style = parts[0];
    }

    return result;
}

export function parseFont(style: any) {
    let result = {};
    result['fontSize'] = parseFontSize(style?.fontSize, style);
    result['fontColor'] = parseColor(style?.color);
    result['textAlign'] = parseTextAlign(style?.textAlign);
    result['letterSpacing'] = convertLengthUnitToSlateUnit(style?.letterSpacing, style);
    result['wordSpacing'] = convertLengthUnitToSlateUnit(style?.wordSpacing, style);
    result['fontFamily'] = parseFontFamily(style?.fontFamily);
    result['fontFaceName'] = parseFontFaceName(style?.fontStyle, style?.fontWeight);
    result['fontSkewAmount'] = parseFontSkewAmount(style?.fontStyle);
    const {outlineStyle, outlineColor, outlineWidth} = parseOutline(style?.outline, style);
    result['outlineStyle'] = outlineStyle;
    result['outlineColor'] = outlineColor;
    result['outlineWidth'] = outlineWidth;
    if (style?.outlineColor) {
        result['outlineColor'] = parseColor(style?.outlineColor);
    }
    if (style?.outlineWidth) {
        result['outlineWidth'] = convertLengthUnitToSlateUnit(style?.outlineWidth, style);
    }

    return result;
}

export function setupFontStyles(outer: UE.Object,font: UE.SlateFontInfo, fontStyle: any) 
{
    if (fontStyle?.fontSize) {
        font.Size = parseFontSize(fontStyle?.fontSize, fontStyle);
    }
    if (fontStyle?.fontStyle) {
        font.SkewAmount = parseFontSkewAmount(fontStyle?.fontStyle);
    }
    if (fontStyle?.fontWeight) {
        font.TypefaceFontName = parseFontFaceName(fontStyle?.fontStyle, fontStyle?.fontWeight);
    }
    if (fontStyle?.fontFamily) {
        const fontFamilyArray = parseFontFamily(fontStyle?.fontFamily);
        if (fontFamilyArray.includes('monospace')) {
            font.bForceMonospaced = true;
        }

        const width = fontStyle?.width;
        if (width) {
            font.MonospacedWidth = convertLengthUnitToSlateUnit(width, fontStyle);
        }

        let familyNames = UE.NewArray(UE.BuiltinString);
        for (const family of fontFamilyArray) {
            familyNames.Add(family);
        }

        const fontObject = UE.UMGManager.FindFontFamily(familyNames, outer);
        if (fontObject) {
            font.FontObject = fontObject;
        }
    }
    if (fontStyle?.letterSpacing) {
        font.LetterSpacing = convertLengthUnitToSlateUnit(fontStyle?.letterSpacing, fontStyle);
    }
    if (fontStyle?.wordSpacing) {
        font.LetterSpacing = convertLengthUnitToSlateUnit(fontStyle?.wordSpacing, fontStyle);
    }
    if (fontStyle?.outline) {
        const outlineResult = parseOutline(fontStyle?.outline, fontStyle);
        font.OutlineSettings.OutlineSize = outlineResult.width;
        font.OutlineSettings.OutlineColor.R = outlineResult.color.r;
        font.OutlineSettings.OutlineColor.G = outlineResult.color.g;
        font.OutlineSettings.OutlineColor.B = outlineResult.color.b;
        font.OutlineSettings.OutlineColor.A = outlineResult.color.a;
    }
    if (fontStyle?.outlineColor) {
        const outlineColor = parseColor(fontStyle?.outlineColor);
        font.OutlineSettings.OutlineColor.R = outlineColor.r;
        font.OutlineSettings.OutlineColor.G = outlineColor.g;
        font.OutlineSettings.OutlineColor.B = outlineColor.b;
        font.OutlineSettings.OutlineColor.A = outlineColor.a;
    }
    if (fontStyle?.outlineWidth) {
        font.OutlineSettings.OutlineSize = convertLengthUnitToSlateUnit(fontStyle?.outlineWidth, fontStyle);
    }
}