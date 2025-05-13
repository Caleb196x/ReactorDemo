import { JSXConverter } from './jsx_converter';
import * as UE from 'ue';
import { getAllStyles } from '../parsers/cssstyle_parser';
import { parseBackgroundProps } from '../parsers/css_background_parser';
import { parseColor } from '../parsers/css_color_parser';

export class ProgressConverter extends JSXConverter {
    private styles: any;

    constructor(typeName: string, props: any, outer: any) {
        super(typeName, props, outer);
        this.styles = getAllStyles(typeName, props);
    }

    private initProgressBarStyle(progressBar: UE.ProgressBar) {
        // background 
        const parsedBackground = parseBackgroundProps(this.styles);
        if (parsedBackground?.image) {
            progressBar.WidgetStyle.BackgroundImage = parsedBackground.image;
        }
        
        if (parsedBackground?.color) {
            progressBar.WidgetStyle.BackgroundImage.Tint = parsedBackground.color;
        }

        // fill
        const fill = this.styles?.fill;
        if (fill) {
            const fillColor = parseColor(fill);
            progressBar.FillColorAndOpacity.R = fillColor.r;
            progressBar.FillColorAndOpacity.G = fillColor.g;
            progressBar.FillColorAndOpacity.B = fillColor.b;
            progressBar.FillColorAndOpacity.A = fillColor.a;
        }
    }

    private calculatePercent(value: number, max: number): number {
        value = Math.max(0, Math.min(value, max));
        return value / max;
    }

    createNativeWidget() {
        const progress = new UE.ProgressBar(this.outer);
        this.initProgressBarStyle(progress);

        const value = this.props?.value || 0;
        const max = this.props?.max || 100;

        let percent = this.calculatePercent(value, max);
        progress.SetPercent(percent);
        return progress;
    }

    update(widget: UE.Widget, oldProps: any, changedProps: any) {
        const progress = widget as UE.ProgressBar;
        const max = changedProps?.max || oldProps?.max || 100;
        if (changedProps.value) {
            const percent = this.calculatePercent(changedProps.value, max);
            progress.SetPercent(percent);
        }
    }
}
