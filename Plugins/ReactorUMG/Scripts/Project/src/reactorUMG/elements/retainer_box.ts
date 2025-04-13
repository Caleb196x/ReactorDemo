import * as UE from 'ue';
import { ComponentWrapper } from "./common_wrapper";

export class RetainerBoxWrapper extends ComponentWrapper {
    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    override convertToWidget(): UE.Widget {
        const retainerBox = new UE.RetainerBox();
        this.commonPropertyInitialized(retainerBox);

        const retainRender = this.props?.retainRender;
        if (retainRender) {
            retainerBox.bRetainRender = retainRender;
        }

        const renderOnInvalidate = this.props?.renderOnInvalidate;
        if (renderOnInvalidate) {
            retainerBox.RenderOnInvalidation = renderOnInvalidate;
        }

        const renderOnPhase = this.props?.renderOnPhase;
        if (renderOnPhase) {
            retainerBox.RenderOnPhase = renderOnPhase;
        }

        const phase = this.props?.phase;
        if (phase) {
            retainerBox.Phase = phase;
        }

        const phaseCount = this.props?.phaseCount;
        if (phaseCount) {
            retainerBox.PhaseCount = phaseCount;
        }

        UE.UMGManager.SynchronizeWidgetProperties(retainerBox);

        return retainerBox;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        const retainerBox = widget as UE.RetainerBox;
        let propsChange = false;
        return propsChange;
    }
} 

