import * as UE from 'ue';
import { ComponentWrapper } from "./common_wrapper";
import { convertLengthUnitToSlateUnit, mergeClassStyleAndInlineStyle, parseFontFamily } from './common_utils';
import { parseColor } from './parser/color_parser';

export class TextBlockWrapper extends ComponentWrapper {
    private readonly richTextSupportTags: string[] = ['a', 'code', 'mark', 'article', 'strong', 'em', 'del'];
    private readonly textFontSetupHandlers: Record<string, (textBlock: UE.TextBlock, prop: any) => void> = {};

    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;

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

    private isRichTextContent(content: any): boolean {
        if (typeof content === 'string') return false;

        if (Array.isArray(content)) {
            return content.some(child => 
                typeof child === 'object' && 
                this.richTextSupportTags.includes(child.type)
            );
        }

        return typeof content === 'object' && 
               this.richTextSupportTags.includes(content.type);
    }

    private convertToRichText(content: any): string {
        if (typeof content === 'string') return content;

        if (Array.isArray(content)) {
            return content.map(child => this.convertToRichText(child)).join('');
        }

        const tag = content.type;
        const children = content.props.children;
        const childContent = this.convertToRichText(children);

        return `<${tag}>${childContent}</>`;
    }

    private createRichTextBlock(content: any): UE.RichTextBlock {
        const richTextBlock = new UE.RichTextBlock();
        const styleSet = UE.DataTable.Find('/Game/NewDataTable.NewDataTable') as UE.DataTable;
        
        const richText = this.convertToRichText(content);
        richTextBlock.SetText(richText);
        richTextBlock.SetTextStyleSet(styleSet);
        // richTextBlock.DefaultTextStyle.

        return richTextBlock;
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
            case 'regular':
                return 'Normal';
            default:
                return 'Default';
        }
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
            const fontFamilyArray = parseFontFamily(fontFamily);
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
        const styles = mergeClassStyleAndInlineStyle(props);
        if (styles) {
            for (const key in styles) {
                if (this.textFontSetupHandlers[key]) {
                    this.textFontSetupHandlers[key](textBlock, styles);
                }
            }
        }
    }

    private createTextBlock(text: string): UE.TextBlock {
        const textBlock = new UE.TextBlock();
        this.setupTextBlockProperties(textBlock, this.props);
        textBlock.SetText(text);
        UE.UMGManager.SynchronizeWidgetProperties(textBlock);
        return textBlock;
    }

    override convertToWidget(): UE.Widget {
        const content = this.props.children;
        let widget: UE.Widget;

        if (this.isRichTextContent(content)) {
            widget = this.createRichTextBlock(content);
        } else {
            widget = this.createTextBlock(
                typeof content === 'string' ? content : ''
            );
        }

        this.commonPropertyInitialized(widget);
        return widget;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        if (!('children' in newProps) || newProps === oldProps) {
            return false;
        }

        const changedProps = {};
        for (const key in newProps) {
            if (newProps[key] !== oldProps[key]) {
                changedProps[key] = true;
            }
        }
        
        const content = this.convertToRichText(newProps.children);

        if (widget instanceof UE.TextBlock) {

            for (const key in changedProps) {
                if (this.textFontSetupHandlers[key]) {
                    this.textFontSetupHandlers[key](widget, newProps);
                }
            }

            widget.SetText(content);
        } else if (widget instanceof UE.RichTextBlock) {
            widget.SetText(content);
        }

        return true;
    }

    override convertReactEventToWidgetEvent(reactProp: string, originCallback: Function): Function {
        return undefined;
    }
}