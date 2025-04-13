import * as UE from 'ue';
import { ComponentWrapper } from './common_wrapper';
import { parseBrush } from './parser/brush_parser';
import { parseColor } from './parser/color_parser';
import { parseBackground, parseBackgroundProps } from './common_utils';

export class ProgressBarWrapper extends ComponentWrapper {
    private readonly defaultProps = {
        value: 0.0,
        max: 100.0
    };

    private usingNativeProgressBar = false;

    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = {...this.defaultProps, ...props};
        this.usingNativeProgressBar = this.typeName === 'ProgressBar';
    }

    private calculatePercent(value: number, max: number): number {
        // Ensure max is not 0 to avoid division by zero
        max = max || this.defaultProps.max;
        // Clamp value between 0 and max
        value = Math.max(0, Math.min(value, max));
        return value / max;
    }

    private updateProgressBar(progressBar: UE.ProgressBar, value: number, max: number) {
        const percent = this.calculatePercent(value, max);
        progressBar.SetPercent(percent);
    }

    private initReactProgressBar(progressBar: UE.ProgressBar) {
        if (!progressBar) {
            return;
        }
        const { value, max } = this.props;
        this.updateProgressBar(progressBar, value, max);

        const style = this.props?.style;
        if (style) {
            const parsedBackground = parseBackgroundProps(style);
            if (parsedBackground?.image) {
                progressBar.WidgetStyle.BackgroundImage = parsedBackground.image;
            }
            
            if (parsedBackground?.color) {
                progressBar.FillColorAndOpacity = parsedBackground.color;
            }
        }
    }

    private initNativeProgressBar(progressBar: UE.ProgressBar) {
        if (!progressBar) {
            return;
        }

        const backgroundImageMap: Record<string, string> = {
            'background': 'BackgroundImage',
            'fillBackground': 'FillImage',
            'marqueeBackground': 'MarqueeImage',
        }
        
        for (const [key, value] of Object.entries(this.props)) {
            if (backgroundImageMap[key]) {
                progressBar.WidgetStyle[backgroundImageMap[key]] = parseBrush(value);
            } else if (key === 'enableFillAnimation') {
                progressBar.WidgetStyle.EnableFillAnimation = value as boolean;
            } else if (key === 'fillColor') {
                const color = parseColor(value as string);
                progressBar.FillColorAndOpacity.R = color.r;
                progressBar.FillColorAndOpacity.G = color.g;
                progressBar.FillColorAndOpacity.B = color.b;
                progressBar.FillColorAndOpacity.A = color.a;
            } else if (key === 'barType') {
                switch (value) {
                    case 'left-to-right':
                        progressBar.BarFillType = UE.EProgressBarFillType.LeftToRight;
                        break;
                    case 'right-to-left':
                        progressBar.BarFillType = UE.EProgressBarFillType.RightToLeft;
                        break;
                    case 'top-to-bottom':
                        progressBar.BarFillType = UE.EProgressBarFillType.TopToBottom;
                        break;
                    case 'bottom-to-top':
                        progressBar.BarFillType = UE.EProgressBarFillType.BottomToTop;
                        break;
                    case 'fill-from-center':
                        progressBar.BarFillType = UE.EProgressBarFillType.FillFromCenter;
                        break;
                    case 'fill-from-center-x':
                        progressBar.BarFillType = UE.EProgressBarFillType.FillFromCenterHorizontal;
                        break;
                    case 'fill-from-center-y':
                        progressBar.BarFillType = UE.EProgressBarFillType.FillFromCenterVertical;
                        break;
                    default:
                        progressBar.BarFillType = UE.EProgressBarFillType.LeftToRight;
                        break;
                } 
            } else if (key === 'precentBinding' && typeof value === 'function') {
                progressBar.PercentDelegate.Bind(value as () => number);
            } else if (key === 'fillColorBinding' && typeof value === 'function') {
                progressBar.FillColorAndOpacityDelegate.Bind(() => {
                    const color = parseColor(value());
                    const linearColor = new UE.LinearColor();
                    linearColor.R = color.r;
                    linearColor.G = color.g;
                    linearColor.B = color.b;
                    linearColor.A = color.a;
                    return linearColor;
                });
            } else if (key === 'precent') {
                progressBar.SetPercent(value as number);
            } else if (key === 'isMarquee') {
                progressBar.SetIsMarquee(value as boolean);
            }
        }
    }

    override convertToWidget(): UE.Widget {
        const progressBar = new UE.ProgressBar();

        this.commonPropertyInitialized(progressBar);
        if (this.usingNativeProgressBar) {
            this.initNativeProgressBar(progressBar);
        } else {
            this.initReactProgressBar(progressBar);
        }

        UE.UMGManager.SynchronizeWidgetProperties(progressBar);
        
        return progressBar;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        const progressBar = widget as UE.ProgressBar;
        let hasChanged = false;

        // Check if value or max have changed
        if (oldProps.value !== newProps.value || oldProps.max !== newProps.max) {
            this.updateProgressBar(progressBar, newProps.value, newProps.max);
            hasChanged = true;
        }

        // Update common properties if needed
        if (hasChanged) {
            this.commonPropertyInitialized(progressBar);
        }

        return hasChanged;
    }

    override convertReactEventToWidgetEvent(reactProp: string, originCallback: Function): Function {
        return undefined;
    }
}