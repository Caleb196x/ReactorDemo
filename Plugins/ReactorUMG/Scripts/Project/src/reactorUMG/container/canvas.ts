import { parseAspectRatio } from "../parsers/css_length_parser";
import { convertLengthUnitToSlateUnit } from "../parsers/css_length_parser";
import { ContainerConverter } from "./container_converter";
import * as UE from "ue";

export class CanvasConverter extends ContainerConverter {
    private predefinedAnchors: Record<string, any>;
    constructor(typeName: string, props: any) {
        super(typeName, props);
        this.predefinedAnchors = {
            // 预设16种锚点
            'top left': {min_x: 0, min_y: 0, max_x: 0, max_y: 0},
            'top center': {min_x: 0.5, min_y: 0, max_x: 0.5, max_y: 0},
            'top right': {min_x: 1, min_y: 0, max_x: 1, max_y: 0},

            'center left': {min_x: 0, min_y: 0.5, max_x: 0, max_y: 0.5},
            'center center': {min_x: 0.5, min_y: 0.5, max_x: 0.5, max_y: 0.5},
            'center right': {min_x: 1, min_y: 0.5, max_x: 1, max_y: 0.5},

            'bottom left': {min_x: 0, min_y: 1, max_x: 0, max_y: 1},
            'bottom center': {min_x: 0.5, min_y: 1, max_x: 0.5, max_y: 1},
            'bottom right': {min_x: 1, min_y: 1, max_x: 1, max_y: 1},

            'top fill': {min_x: 0, min_y: 0, max_x: 1, max_y: 0},
            'center fill': {min_x: 0, min_y: 0.5, max_x: 1, max_y: 0.5},
            'bottom fill': {min_x: 0, min_y: 1, max_x: 1, max_y: 1},
            'top span-all': {min_x: 0, min_y: 0, max_x: 1, max_y: 0},
            'center span-all': {min_x: 0, min_y: 0.5, max_x: 1, max_y: 0.5},
            'bottom span-all': {min_x: 0, min_y: 1, max_x: 1, max_y: 1},

            'span-all left': {min_x: 0, min_y: 0, max_x: 0, max_y: 1},
            'span-all center': {min_x: 0.5, min_y: 0, max_x: 0.5, max_y: 1},
            'span-all right': {min_x: 1, min_y: 0, max_x: 1, max_y: 1},
            'fill left': {min_x: 0, min_y: 0, max_x: 0, max_y: 1},
            'fill center': {min_x: 0.5, min_y: 0, max_x: 0.5, max_y: 1},
            'fill right': {min_x: 1, min_y: 0, max_x: 1, max_y: 1},

            'fill': {min_x: 0, min_y: 0, max_x: 1, max_y: 1},
            'span-all': {min_x: 0, min_y: 0, max_x: 1, max_y: 1},
            // todo@Caleb196x: 添加更多CSS描述
        };
    }
    
    createNativeWidget(): UE.Widget {
        const widget = new UE.CanvasPanel();
        return widget;
    }

    update(widget: UE.Widget, oldProps: any, changedProps: any): void {
        
    }

    private initCanvasSlot(canvasSlot: UE.CanvasPanelSlot, childStyle: any): void {
        const positionAnchor = this.containerStyle?.positionAnchor;
        const offsetAnchor = this.containerStyle?.offsetAnchor;

        const width = childStyle?.width || 'none';
        const height = childStyle?.height || 'none';

        const scale = childStyle?.scale || 1.0;
        const aspectRatio = childStyle?.aspectRatio || 'auto';
        
        let positionAnchors: any = null;
        if (positionAnchor) {
            positionAnchors = this.predefinedAnchors[positionAnchor];

        } else if (offsetAnchor) {
            positionAnchors = this.predefinedAnchors[offsetAnchor];
        }

        if (positionAnchors) {
            canvasSlot.SetAnchors(new UE.Anchors(new UE.Vector2D(positionAnchors.min_x, positionAnchors.min_y), 
                                                new UE.Vector2D(positionAnchors.max_x, positionAnchors.max_y)));
        } else {
            canvasSlot.SetAnchors(new UE.Anchors(new UE.Vector2D(0, 0), new UE.Vector2D(0, 0)));
        }

        // loction
        const top = childStyle?.top || '0px';
        const left = childStyle?.left || '0px';
        const right = childStyle?.right || '0px';
        const bottom = childStyle?.bottom || '0px';

        const topSU = convertLengthUnitToSlateUnit(top, childStyle);
        const leftSU = convertLengthUnitToSlateUnit(left, childStyle);
        if (!(positionAnchor?.includes('fill')) || !(positionAnchor?.includes('span-all'))) {
            canvasSlot.SetPosition(new UE.Vector2D(leftSU, topSU));
        } else {
            const rightSU = convertLengthUnitToSlateUnit(right, childStyle);
            const bottomSU = convertLengthUnitToSlateUnit(bottom, childStyle);
            canvasSlot.SetOffsets(new UE.Margin(leftSU, topSU, rightSU, bottomSU));
        }
        
        if (width !== 'none' && height !== 'none') {
            const widthSU = convertLengthUnitToSlateUnit(width, childStyle);
            const heightSU = convertLengthUnitToSlateUnit(height, childStyle);
            canvasSlot.SetSize(new UE.Vector2D(widthSU * scale, heightSU * scale));
        } else if (width !== 'none' && height === 'none') {

            const widthSU = convertLengthUnitToSlateUnit(width, childStyle);
            if (aspectRatio !== 'auto') {
                const desiredHeight = widthSU / parseAspectRatio(aspectRatio);
                canvasSlot.SetSize(new UE.Vector2D(widthSU * scale, desiredHeight * scale));
            } else {
                canvasSlot.SetSize(new UE.Vector2D(widthSU * scale, widthSU * scale));
            }

        } else if (height !== 'none' && width === 'none') {

            const heightSU = convertLengthUnitToSlateUnit(height, childStyle);
            if (aspectRatio !== 'auto') {
                const desiredWidth = heightSU * parseAspectRatio(aspectRatio);
                canvasSlot.SetSize(new UE.Vector2D(desiredWidth * scale, heightSU * scale));
            } else {
                canvasSlot.SetSize(new UE.Vector2D(heightSU * scale, heightSU * scale));
            }

        } else {
            canvasSlot.SetAutoSize(true);
        }

    }
    appendChild(parent: UE.Widget, child: UE.Widget, childTypeName: string, childProps: any): void {
        let canvasPanel = parent as UE.CanvasPanel;
        const canvasSlot = canvasPanel.AddChildToCanvas(child);
        this.initCanvasSlot(canvasSlot, childProps);
    }
    
}
