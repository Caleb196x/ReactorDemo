import { ComponentWrapper } from "./common_wrapper";
import * as UE from 'ue';
import { parseBrush } from "./parser/brush_parser";
import { convertMargin } from "./common_utils";
import { parseColor } from "./parser/color_parser";
import { $Nullable } from "puerts";

export class ExpandableAreaWrapper extends ComponentWrapper {
    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    private valueConvertKeyMap: Record<string, string> = {
        'expanded': 'bIsExpanded',
        'maxHeight': 'MaxHeight',
    }

    private styleKeyMap: Record<string, string> = {
        'collapsedIcon': 'CollapsedImage',
        'expandedIcon': 'ExpandedImage',
    }

    private paddingKeyMap: Record<string, string> = {
        'headerPadding': 'HeaderPadding',
        'areaPadding': 'AreaPadding',
    }

    private WidgetKeyMap: Record<string, string> = {
        'header': 'HeaderContent',
        'area': 'BodyContent',
    }

    override convertToWidget(): UE.Widget {
        const expandableArea = new UE.ExpandableArea();
        this.commonPropertyInitialized(expandableArea);

        for (const key in this.props) {
            if (this.valueConvertKeyMap[key]) {
                expandableArea[this.valueConvertKeyMap[key]] = this.props[key];
            } else if (this.styleKeyMap[key]) {
                expandableArea.Style[this.styleKeyMap[key]] = parseBrush(this.props[key]);
            } else if (this.WidgetKeyMap[key]) {
                // todo@Caleb196x: 添加SetHeaderContent和SetAreaContent方法
            } else if (this.paddingKeyMap[key]) {
                expandableArea[this.paddingKeyMap[key]] = convertMargin(this.props[key], {});
            } else if (key === 'borderColor') {
                const rgba = parseColor(this.props[key]);
                expandableArea.BorderColor.SpecifiedColor = new UE.LinearColor(rgba.r, rgba.g, rgba.b, rgba.a);
            } else if (key === 'borderImage') {
                expandableArea.BorderBrush = parseBrush(this.props[key]);
            } else if (key === 'rolloutAnimationLasts') {
                expandableArea.Style.RolloutAnimationSeconds = this.props[key];
            } else if (key === 'onExpansionChanged' && typeof this.props[key] === 'function') {
                expandableArea.OnExpansionChanged.Add(
                    (Area: $Nullable<UE.ExpandableArea>, bIsExpanded: boolean) => {
                        this.props[key](bIsExpanded);
                    }
                );
            }
        }

        UE.UMGManager.SynchronizeWidgetProperties(expandableArea);

        return expandableArea;
    }
    
    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        const expandableArea = widget as UE.ExpandableArea;
        let propsChange = false; 
        return propsChange;
    }
}
