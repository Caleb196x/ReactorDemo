import { parseColor } from '../parsers/css_color_parser';
import { convertLengthUnitToSlateUnit } from '../parsers/css_length_parser';
import { getAllStyles } from '../parsers/cssstyle_parser';
import { JSXConverter } from './jsx_converter';
import * as UE from 'ue';

export class TextConverter extends JSXConverter {
    private readonly textFontSetupHandlers: Record<string, (textBlock: UE.TextBlock, prop: any) => void> = {};

    constructor(typeName: string, props: any) {
        super(typeName, props);
        this.textFontSetupHandlers = {
            'fontSize': this.setupFontSize,
            'fontColor': this.setupFontColor,
            'textAlign': this.setupTextAlignment,
            'fontStyle': this.setupFontStyle,
            'letterSpacing': this.setupLetterSpacing,
            'outline': this.setupOutline,
            'outlineColor': this.setupOutlineColor,
            'outlineWidth': this.setupOutlineWidth,
            'textTransform': this.setupTextTransform,
            'lineHeight': this.setupLineHeight,
            'fontFamily': this.setupFontFamily
        }
    }

    
    private safeFontStyle(fontStyle: string): string {
        switch (fontStyle) {
            case 'italic':
                return 'Italic';
            case 'bold':
                return 'Bold';
            case 'blod italic':
                return 'Bold Italic';
            case 'light':
                return 'Light';
            case 'normal':
                return 'Regular';
            default:
                return fontStyle;
        }
    }

    parseFontFamily(cssText: string) {
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

    private setupFontSize(textBlock: UE.TextBlock, prop: any) {
        const fontSize = prop?.fontSize;
        if (fontSize) {
            textBlock.Font.Size = fontSize <= 0 ? 12 : fontSize;
        }
    }

    private setupFontColor(textBlock: UE.TextBlock, prop: any) {
        const fontColor = prop?.fontColor;
        if (fontColor) {
            const rgba = parseColor(fontColor);
            textBlock.ColorAndOpacity.SpecifiedColor.R = rgba.r;
            textBlock.ColorAndOpacity.SpecifiedColor.G = rgba.g;
            textBlock.ColorAndOpacity.SpecifiedColor.B = rgba.b;
            textBlock.ColorAndOpacity.SpecifiedColor.A = rgba.a;
        }
    }

    private setupTextAlignment(textBlock: UE.TextBlock, prop: any) {
        const textAlignment = prop?.textAlign;
        if (textAlignment) {
            textBlock.Justification = textAlignment === 'center' ? UE.ETextJustify.Center : 
                textAlignment === 'right' ? UE.ETextJustify.Right : UE.ETextJustify.Left;
        }
    }

    private setupFontStyle(textBlock: UE.TextBlock, prop: any) {
        const fontStyle = prop?.fontStyle;
        if (fontStyle) {
            if (fontStyle.includes('oblique')) {
                // Handle oblique with angle (e.g., "oblique 10deg")
                const obliqueMatch = fontStyle.match(/oblique\s+(\d+)deg/);
                if (obliqueMatch && obliqueMatch[1]) {
                    const angleDegrees = parseInt(obliqueMatch[1], 10);
                    // Convert degrees to radians (UE uses radians for skew)
                    const angleRadians = angleDegrees * (Math.PI / 180);
                    textBlock.Font.SkewAmount = angleRadians;
                }
            } else {
                textBlock.Font.TypefaceFontName = this.safeFontStyle(fontStyle); // fixme@Caleb: some font family does not support the specified font style
            }
        }
    }

    private setupLetterSpacing(textBlock: UE.TextBlock, prop: any) {
        const letterSpacing = prop?.letterSpacing;
        if (letterSpacing) {
            textBlock.Font.LetterSpacing = convertLengthUnitToSlateUnit(letterSpacing, prop);
        }

        const wordSpacing = prop?.wordSpacing;
        if (wordSpacing) {
            textBlock.Font.LetterSpacing = convertLengthUnitToSlateUnit(wordSpacing, prop);
        }
    }

    private setupOutline(textBlock: UE.TextBlock, prop: any) {
        const outline = prop?.outline;
        if (outline) {
            // Parse outline CSS property
            // Format can be: <color> <size> or just <size>
            const outlineMatch = outline.match(/^(?:(#[0-9a-f]+|rgba?\([^)]+\))\s+)?(\d+(?:\.\d+)?)(px)?$/i);
            
            if (outlineMatch) {
                // Initialize outline settings if not already created
                if (!textBlock.Font.OutlineSettings) {
                    textBlock.Font.OutlineSettings = new UE.FontOutlineSettings();
                }
                
                // Set outline size
                const outlineSize = parseFloat(outlineMatch[2]);
                textBlock.Font.OutlineSettings.OutlineSize = outlineSize;
                
                // Set outline color if provided
                if (outlineMatch[1]) {
                    const outlineColor = parseColor(outlineMatch[1]);
                    textBlock.Font.OutlineSettings.OutlineColor.R = outlineColor.r;
                    textBlock.Font.OutlineSettings.OutlineColor.G = outlineColor.g;
                    textBlock.Font.OutlineSettings.OutlineColor.B = outlineColor.b;
                    textBlock.Font.OutlineSettings.OutlineColor.A = outlineColor.a;
                } else {
                    // Default to black if no color specified
                    textBlock.Font.OutlineSettings.OutlineColor.R = 0;
                    textBlock.Font.OutlineSettings.OutlineColor.G = 0;
                    textBlock.Font.OutlineSettings.OutlineColor.B = 0;
                    textBlock.Font.OutlineSettings.OutlineColor.A = 1;
                }
            }
        }
    }

    private setupOutlineColor(textBlock: UE.TextBlock, prop: any) {
        const outlineColor = prop?.outlineColor;
        if (outlineColor) {
            const rgba = parseColor(outlineColor);
            textBlock.Font.OutlineSettings.OutlineColor.R = rgba.r;
            textBlock.Font.OutlineSettings.OutlineColor.G = rgba.g;
            textBlock.Font.OutlineSettings.OutlineColor.B = rgba.b;
            textBlock.Font.OutlineSettings.OutlineColor.A = rgba.a;
        }
    }

    private setupOutlineWidth(textBlock: UE.TextBlock, prop: any) {
        const outlineWidth = prop?.outlineWidth;
        if (outlineWidth) {
            textBlock.Font.OutlineSettings.OutlineSize = convertLengthUnitToSlateUnit(outlineWidth, prop);
        }
    }

    private setupTextTransform(textBlock: UE.TextBlock, prop: any) {
        const textTransform = prop?.textTransform;
        if (textTransform) {
            textBlock.TextTransformPolicy = textTransform === 'uppercase' ? UE.ETextTransformPolicy.ToUpper : 
                textTransform === 'lowercase' ? UE.ETextTransformPolicy.ToLower : UE.ETextTransformPolicy.None;
        }
    }

    private setupLineHeight(textBlock: UE.TextBlock, prop: any) {
        const lineHeight = prop?.lineHeight;
        if (lineHeight) {
            textBlock.LineHeightPercentage = convertLengthUnitToSlateUnit(lineHeight, prop);
        }
    }

    private setupFontFamily(textBlock: UE.TextBlock, prop: any) {
        const fontFamily = prop?.fontFamily;
        if (fontFamily) {
            const fontFamilyArray = this.parseFontFamily(fontFamily);
            if (fontFamilyArray.includes('monospace')) {
                textBlock.Font.bForceMonospaced = true;
            }

            const width = prop?.width;
            if (width) {
                textBlock.Font.MonospacedWidth = convertLengthUnitToSlateUnit(width, prop);
            }

            let familyNames = UE.NewArray(UE.BuiltinString);
            for (const family of fontFamilyArray) {
                familyNames.Add(family);
            }
    
            const fontObject = UE.UMGManager.FindFontFamily(familyNames, textBlock);
            if (fontObject) {
                textBlock.Font.FontObject = fontObject;
            }
        }
    }

    private setupTextBlockProperties(textBlock: UE.TextBlock, props: any) {
        const styles = getAllStyles(this.typeName, props);
        if (styles) {
            for (const key in styles) {
                if (this.textFontSetupHandlers[key]) {
                    this.textFontSetupHandlers[key](textBlock, styles);
                }
            }
        }
    }

    createNativeWidget() {
        const text = new UE.TextBlock();
        this.setupTextBlockProperties(text, this.props);
        const content = this.props?.children;
        if (content && typeof content === 'string') {
            text.SetText(content);
        }
        UE.UMGManager.SynchronizeWidgetProperties(text);
        return text;
    }

    update(widget: UE.Widget, oldProps: any, changedProps: any) {
        const text = widget as UE.TextBlock;
        const content = changedProps?.children;
        if (content && typeof content === 'string') {
            text.SetText(content);
        }
        this.setupTextBlockProperties(text, changedProps);
        if (changedProps?.style) {
            UE.UMGManager.SynchronizeWidgetProperties(text);
        }
    }
}