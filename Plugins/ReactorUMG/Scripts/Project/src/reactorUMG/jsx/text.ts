import { parseToLinearColor } from '../parsers/css_color_parser';
import { hasFontStyles, parseFont, setupFontStyles } from '../parsers/css_font_parser';
import { convertLengthUnitToSlateUnit } from '../parsers/css_length_parser';
import { getAllStyles } from '../parsers/cssstyle_parser';
import { JSXConverter } from './jsx_converter';
import * as UE from 'ue';

export class TextConverter extends JSXConverter {
    private readonly textFontSetupHandlers: Record<string, (textBlock: UE.TextBlock, prop: any) => void> = {};

    constructor(typeName: string, props: any, outer: any) {
        super(typeName, props, outer);
        this.textFontSetupHandlers = {
            'color': this.setupFontColor,
            'fontColor': this.setupFontColor,
            'textAlign': this.setupTextAlignment,
            'textTransform': this.setupTextTransform,
            'lineHeight': this.setupLineHeight
        }
    }
    
    private setupFontColor(textBlock: UE.TextBlock, prop: any) {
        const fontColor = prop?.color;
        if (fontColor) {
            const rgba = parseToLinearColor(fontColor);
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

    private setupTextBlockProperties(textBlock: UE.TextBlock, props: any) {
        const styles = getAllStyles(this.typeName, props);
        if (hasFontStyles(styles)) {
            if (!textBlock.Font) {
                const fontStyles = new UE.SlateFontInfo();
                setupFontStyles(textBlock, fontStyles, styles);
                textBlock.SetFont(fontStyles);
            } else {
                setupFontStyles(textBlock, textBlock.Font, styles);
            }
        }

        
        for (const key in styles) {
            if (this.textFontSetupHandlers[key]) {
                this.textFontSetupHandlers[key](textBlock, styles);
            }
        }
    }

    createNativeWidget() {
        const text = new UE.TextBlock(this.outer);
        this.setupTextBlockProperties(text, this.props);
        const content = this.props?.children || this.props?.text;
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