import * as UE from 'ue';
import { ComponentWrapper } from "./common_wrapper";
import { convertLengthUnitToSlateUnit, mergeClassStyleAndInlineStyle } from './common_utils';
import { parseColor } from './parser/color_parser';

export class TextBlockWrapper extends ComponentWrapper {
    private readonly richTextSupportTags: string[] = ['a', 'code', 'mark', 'article', 'strong', 'em', 'del'];

    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
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
                return 'Normal';
        }
    }

    private setupTextBlockProperties(textBlock: UE.TextBlock, props: any) {
        const styles = mergeClassStyleAndInlineStyle(props);
        if (styles) {
            const fontSize = styles?.fontSize;
            if (fontSize) {
                textBlock.Font.Size = fontSize <= 0 ? 12 : fontSize;
            }

            const fontColor = styles?.fontColor;
            if (fontColor) {
                const rgba = parseColor(fontColor);
                textBlock.ColorAndOpacity.SpecifiedColor.R = rgba.r;
                textBlock.ColorAndOpacity.SpecifiedColor.G = rgba.g;
                textBlock.ColorAndOpacity.SpecifiedColor.B = rgba.b;
                textBlock.ColorAndOpacity.SpecifiedColor.A = rgba.a;
            }

            const textAlignment = styles?.textAlign;
            if (textAlignment) {
                textBlock.Justification = textAlignment === 'center' ? UE.ETextJustify.Center : 
                    textAlignment === 'right' ? UE.ETextJustify.Right : UE.ETextJustify.Left;
            }

            const fontStyle = styles?.fontStyle;
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

            const letterSpacing = styles?.letterSpacing;
            if (letterSpacing) {
                textBlock.Font.LetterSpacing = convertLengthUnitToSlateUnit(letterSpacing, styles);
            }

            const wordSpacing = styles?.wordSpacing;
            if (wordSpacing) {
                textBlock.Font.LetterSpacing = convertLengthUnitToSlateUnit(wordSpacing, styles);
            }
            
            const outline = styles?.outline;
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

            const outlineColor = styles?.outlineColor;
            if (outlineColor) {
                const rgba = parseColor(outlineColor);
                textBlock.Font.OutlineSettings.OutlineColor.R = rgba.r;
                textBlock.Font.OutlineSettings.OutlineColor.G = rgba.g;
                textBlock.Font.OutlineSettings.OutlineColor.B = rgba.b;
                textBlock.Font.OutlineSettings.OutlineColor.A = rgba.a;
            }

            const outlineWidth = styles?.outlineWidth;
            if (outlineWidth) {
                textBlock.Font.OutlineSettings.OutlineSize = convertLengthUnitToSlateUnit(outlineWidth, styles);
            }

            const textTransform = styles?.textTransform;
            if (textTransform) {
                textBlock.TextTransformPolicy = textTransform === 'uppercase' ? UE.ETextTransformPolicy.ToUpper : 
                    textTransform === 'lowercase' ? UE.ETextTransformPolicy.ToLower : UE.ETextTransformPolicy.None;
            }

            const lineHeight = styles?.lineHeight;
            if (lineHeight) {
                textBlock.LineHeightPercentage = convertLengthUnitToSlateUnit(lineHeight, styles);
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

        const content = this.convertToRichText(newProps.children);

        if (widget instanceof UE.TextBlock) {
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