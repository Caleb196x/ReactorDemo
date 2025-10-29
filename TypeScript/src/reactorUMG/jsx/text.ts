import { parseToLinearColor } from '../parsers/css_color_parser';
import { hasFontStyles, setupFontStyles } from '../parsers/css_font_parser';
import { convertLengthUnitToSlateUnit } from '../parsers/css_length_parser';
import { getAllStyles } from '../parsers/cssstyle_parser';
import { JSXConverter } from './jsx_converter';
import * as UE from 'ue';

type TextStyleProps = Record<string, any>;

export class TextConverter extends JSXConverter {
    private readonly textFontSetupHandlers: Record<string, (textBlock: UE.TextBlock, prop: any) => void> = {};
    private static readonly elementDefaultStyles: Record<string, TextStyleProps> = {
        'text': {
            lineHeight: '1.4'
        },
        'span': {
            lineHeight: '1.4'
        },
        'label': {
            fontWeight: '600',
            lineHeight: '1.4'
        },
        'p': {
            lineHeight: '1.6',
            marginBottom: '12px'
        },
        'a': {
            color: '#1e90ff',
            textDecoration: 'underline',
            lineHeight: '1.4'
        },
        'h1': {
            fontSize: '32px',
            fontWeight: '700',
            lineHeight: '1.25'
        },
        'h2': {
            fontSize: '28px',
            fontWeight: '700',
            lineHeight: '1.3'
        },
        'h3': {
            fontSize: '24px',
            fontWeight: '600',
            lineHeight: '1.35'
        },
        'h4': {
            fontSize: '20px',
            fontWeight: '600',
            lineHeight: '1.4'
        },
        'h5': {
            fontSize: '18px',
            fontWeight: '600',
            lineHeight: '1.45'
        },
        'h6': {
            fontSize: '16px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            lineHeight: '1.45'
        }
    };
    private readonly loweredTypeName: string;

    constructor(typeName: string, props: any, outer: any) {
        super(typeName, props, outer);
        this.loweredTypeName = (typeName ?? '').toLowerCase();
        this.textFontSetupHandlers = {
            color: this.setupFontColor,
            fontColor: this.setupFontColor,
            textAlign: this.setupTextAlignment,
            textTransform: this.setupTextTransform,
            lineHeight: this.setupLineHeight,
        };
    }

    private normalizeStyles(props: any): TextStyleProps {
        const styles = getAllStyles(this.typeName, props) ?? {};
        const defaults = TextConverter.elementDefaultStyles[this.loweredTypeName] ?? {};
        const resolved: TextStyleProps = { ...defaults, ...styles };

        if (props) {
            const directKeys = ['color', 'fontColor', 'textAlign', 'textTransform', 'lineHeight'];
            for (const key of directKeys) {
                if (props[key] !== undefined) {
                    resolved[key] = props[key];
                }
            }
        }

        return resolved;
    }

    private setupFontColor(textBlock: UE.TextBlock, prop: any) {
        const fontColor = prop?.color ?? prop?.fontColor;
        if (!fontColor) {
            return;
        }
        const rgba = parseToLinearColor(fontColor);
        const specifiedColor = textBlock.ColorAndOpacity?.SpecifiedColor;
        if (!specifiedColor) {
            return;
        }
        
        specifiedColor.R = rgba.r;
        specifiedColor.G = rgba.g;
        specifiedColor.B = rgba.b;
        specifiedColor.A = rgba.a;
    }

    private setupTextAlignment(textBlock: UE.TextBlock, prop: any) {
        const textAlignment = prop?.textAlign;
        if (!textAlignment) {
            return;
        }
        switch (textAlignment) {
            case 'center':
                textBlock.Justification = UE.ETextJustify.Center;
                break;
            case 'right':
                textBlock.Justification = UE.ETextJustify.Right;
                break;
            default:
                textBlock.Justification = UE.ETextJustify.Left;
        }
    }

    private setupTextTransform(textBlock: UE.TextBlock, prop: any) {
        const textTransform = prop?.textTransform;
        if (!textTransform) {
            return;
        }
        switch (textTransform) {
            case 'uppercase':
                textBlock.TextTransformPolicy = UE.ETextTransformPolicy.ToUpper;
                break;
            case 'lowercase':
                textBlock.TextTransformPolicy = UE.ETextTransformPolicy.ToLower;
                break;
            default:
                textBlock.TextTransformPolicy = UE.ETextTransformPolicy.None;
        }
    }

    private normalizeLineHeight(lineHeight: any, styleContext: any): number | null {
        if (lineHeight === null || lineHeight === undefined) {
            return null;
        }
        if (typeof lineHeight === 'number') {
            return lineHeight;
        }
        if (typeof lineHeight === 'string' && lineHeight.trim().length > 0) {
            return convertLengthUnitToSlateUnit(lineHeight, styleContext);
        }
        return null;
    }

    private setupLineHeight(textBlock: UE.TextBlock, prop: any) {
        const lineHeight = prop?.lineHeight;
        const resolved = this.normalizeLineHeight(lineHeight, prop);
        if (resolved !== null) {
            textBlock.LineHeightPercentage = resolved;
        }
    }

    private setupTextBlockProperties(textBlock: UE.TextBlock, props: any) {
        const styles = this.normalizeStyles(props);
        if (hasFontStyles(styles)) {
            if (!textBlock.Font) {
                const fontStyles = new UE.SlateFontInfo();
                setupFontStyles(textBlock, fontStyles, styles);
                textBlock.SetFont(fontStyles);
            } else {
                setupFontStyles(textBlock, textBlock.Font, styles);
            }
        }

        for (const key in this.textFontSetupHandlers) {
            if (Object.prototype.hasOwnProperty.call(styles, key)) {
                this.textFontSetupHandlers[key](textBlock, styles);
            }
        }
    }

    private normalizeContent(value: any): string | undefined {
        if (value === undefined) {
            return undefined;
        }
        if (value === null) {
            return '';
        }
        if (Array.isArray(value)) {
            return value.map((item) => this.normalizeContent(item) ?? '').join('');
        }
        if (typeof value === 'string') {
            return value;
        }
        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }
        return String(value);
    }

    private extractTextContent(props: any): string {
        if (!props) {
            return '';
        }

        if (Object.prototype.hasOwnProperty.call(props, 'children')) {
            const normalized = this.normalizeContent(props.children);
            if (normalized !== undefined) {
                return normalized;
            }
        }

        if (Object.prototype.hasOwnProperty.call(props, 'text')) {
            const normalized = this.normalizeContent(props.text);
            if (normalized !== undefined) {
                return normalized;
            }
        }

        return '';
    }

    private applyTextContent(textBlock: UE.TextBlock, content: string) {
        textBlock.SetText(content ?? '');
    }

    createNativeWidget() {
        const text = new UE.TextBlock(this.outer);
        this.setupTextBlockProperties(text, this.props);
        const content = this.extractTextContent(this.props);
        this.applyTextContent(text, content);
        UE.UMGManager.SynchronizeWidgetProperties(text);
        return text;
    }

    update(widget: UE.Widget, _oldProps: any, _changedProps: any) {
        const text = widget as UE.TextBlock;
        this.setupTextBlockProperties(text, this.props);
        const content = this.extractTextContent(this.props);
        this.applyTextContent(text, content);
        UE.UMGManager.SynchronizeWidgetProperties(text);
    }
}
