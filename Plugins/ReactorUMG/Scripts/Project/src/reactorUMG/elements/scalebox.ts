import * as UE from 'ue';
import { ComponentWrapper } from "./common_wrapper";

export class ScaleBoxWrapper extends ComponentWrapper {
    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    private parseStretch(stretch: string, scale: number) {
        let stretchType = UE.EStretch.None;
        switch (stretch) {
            case 'contain':
                stretchType = UE.EStretch.ScaleToFit;
                break;
            case 'cover': 
                stretchType = UE.EStretch.ScaleToFill;
                break;
            case 'fill':
                stretchType = UE.EStretch.Fill;
                break;
            case 'scale-y':
                stretchType = UE.EStretch.ScaleToFitY;
                break;
            case 'scale-x':
                stretchType = UE.EStretch.ScaleToFitX;
                break;
            case 'custom':
                stretchType = UE.EStretch.UserSpecified;
                break;
        }

        if (scale && stretch === 'custom') {
            return {
                Stretch: stretchType,
                UserSpecifiedScale: scale
            };
        }

        return {
            Stretch: stretchType
        };

    }

    override convertToWidget(): UE.Widget {
        const scaleBox = new UE.ScaleBox();
        this.commonPropertyInitialized(scaleBox);

        const stretch = this.props?.stretch;
        const scale = this.props?.scale;
        if (stretch) {
            const {Stretch, UserSpecifiedScale} = this.parseStretch(stretch, scale);
            scaleBox.SetStretch(Stretch);
            if (UserSpecifiedScale) {
                scaleBox.SetUserSpecifiedScale(UserSpecifiedScale);
            }
        }

        return scaleBox;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        const overlay = widget as UE.Overlay;
        let propsChange = false;
        return propsChange;
    }
}

