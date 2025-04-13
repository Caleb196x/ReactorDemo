import * as UE from 'ue';
import { ComponentWrapper } from "./common_wrapper";

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

    private createTextBlock(text: string): UE.TextBlock {
        const textBlock = new UE.TextBlock();
        textBlock.SetText(text);
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
        if (!('children' in newProps) || newProps.children === oldProps.children) {
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