import { ComponentWrapper } from "./common_wrapper";
import * as UE from 'ue';

export class RiveWrapper extends ComponentWrapper {
    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    private convertFitType(fitType: string) {
        switch (fitType) {
            case "contain":
                return UE.ERiveFitType.Contain;
            case "cover":
                return UE.ERiveFitType.Cover;
            case "fill":
                return UE.ERiveFitType.Fill;
            case "fit-width":
                return UE.ERiveFitType.FitWidth;
            case "fit-height":
                return UE.ERiveFitType.FitHeight;
            case "none":
                return UE.ERiveFitType.None;
            case "scale-down":
                return UE.ERiveFitType.ScaleDown;
            case "layout":
                return UE.ERiveFitType.Layout;
            default:
                return UE.ERiveFitType.Contain;
        }
    }

    private convertAlignment(alignment: string) {
        switch (alignment) {
            case "top-left":
                return UE.ERiveAlignment.TopLeft;
            case "top-center":
                return UE.ERiveAlignment.TopCenter;
            case "top-right":
                return UE.ERiveAlignment.TopRight;
            case "center-left":
                return UE.ERiveAlignment.CenterLeft;
            case "center-right":
                return UE.ERiveAlignment.CenterRight;
            case "bottom-left":
                return UE.ERiveAlignment.BottomLeft;
            case "bottom-center":
                return UE.ERiveAlignment.BottomCenter;
            case "bottom-right":
                return UE.ERiveAlignment.BottomRight;
            case "center":
                return UE.ERiveAlignment.Center;
            default:
                return UE.ERiveAlignment.Center;
        }
    }

    override convertToWidget() {
        // const Rive = new UE.ReactRiveWidget();
        const World = UE.UMGManager.GetWorld();
        const Rive = UE.UMGManager.CreateWidget(World, UE.RiveWidget.StaticClass()) as UE.RiveWidget;
        this.commonPropertyInitialized(Rive);

        const artBoard = this.props?.artBoard || "";
        const artBoardIndex = this.props?.artBoardIndex || 0;
        const fitType = this.props?.fitType || "contain";
        const scale = this.props?.scale || 1.0;
        const alignment = this.props?.alignment || "center";

        const riveFile = this.props?.rive;
        if (riveFile) {
            const descriptor = new UE.RiveDescriptor();
            descriptor.RiveFile = UE.UMGManager.LoadRiveFile(Rive, riveFile);
            descriptor.ArtboardName = artBoard;
            descriptor.ArtboardIndex = artBoardIndex;
            descriptor.FitType = this.convertFitType(fitType);
            descriptor.ScaleFactor = scale;
            descriptor.Alignment = this.convertAlignment(alignment);
            Rive.SetRiveDescriptor(descriptor);
        }

        // const initStateMachine = this.props?.initStateMachine;
        // if (initStateMachine && initStateMachine !== '') {
        //     Rive.SetStateMachine(initStateMachine);
        // }

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
