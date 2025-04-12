import * as UE from 'ue';
import { ComponentWrapper } from "./common_wrapper";

export class SafeZoneWrapper extends ComponentWrapper {
    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    override convertToWidget(): UE.Widget {
        const safeZone = new UE.SafeZone();
        this.commonPropertyInitialized(safeZone);

        const padLeft = this.props?.padLeft;
        if (padLeft) {
            safeZone.PadLeft = padLeft;
        }

        const padRight = this.props?.padRight;
        if (padRight) {
            safeZone.PadRight = padRight;
        }

        const padTop = this.props?.padTop;
        if (padTop) {
            safeZone.PadTop = padTop;
        }

        const padBottom = this.props?.padBottom;
        if (padBottom) {
            safeZone.PadBottom = padBottom;
        }

        UE.UMGManager.SynchronizeWidgetProperties(safeZone);

        return safeZone;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        const safeZone = widget as UE.SafeZone;
        let propsChange = false;
        return propsChange;
    }
}
