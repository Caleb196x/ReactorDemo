import { ComponentWrapper } from "./common_wrapper";
import * as UE from 'ue';

export class RiveWrapper extends ComponentWrapper {
    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    override convertToWidget() {
        const Rive = new UE.ReactRiveWidget();
        this.commonPropertyInitialized(Rive);

        const riveFile = this.props?.rive;
        if (riveFile) {
            Rive.SetRiveFile(UE.UMGManager.LoadRiveFile(Rive, riveFile));
        }

        const initStateMachine = this.props?.initStateMachine;
        if (initStateMachine && initStateMachine !== '') {
            Rive.SetStateMachine(initStateMachine);
        }

        const RiveReady = this.props?.onRiveReady;
        if (RiveReady) {
            Rive.OnRiveReady.Add(RiveReady);
        }

        return Rive;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        const Rive = widget as UE.ReactRiveWidget;
        let propsChange = false;
        return propsChange;
    }
}
