import * as UE from 'ue';
import { findChangedProps, isKeyOfRecord, safeParseFloat } from './misc/utils';
import { FlexConverter } from './container/flex';
import { CanvasConverter } from './container/canvas';
import { GridConverter } from './container/grid';
import { OverlayConverter } from './container/overlay';
import { getAllStyles } from './parsers/cssstyle_parser';
import { parseCursor, parseTransform, parseTransformPivot, parseTranslate, parseVisibility } from './parsers/common_props_parser';

export abstract class ElementConverter {
    typeName: string;
    props: any;

    constructor(typeName: string, props: any) {
        this.typeName = typeName;
        this.props = props;
    }

    abstract createNativeWidget(): UE.Widget;
    abstract update(widget: UE.Widget, oldProps: any, changedProps: any): void;
    abstract appendChild(parent: UE.Widget, child: UE.Widget): void;
    abstract removeChild(parent: UE.Widget, child: UE.Widget): void;
    creatWidget(): UE.Widget {
        let widget = this.createNativeWidget();
        this.initOrUpdateCommonProperties(widget, this.props);
        return widget;
    }

    updateWidget(widget: UE.Widget, oldProps: any, newProps: any) {
        // Find changed properties between oldProps and newProps
        const changedProps = findChangedProps(oldProps, newProps);
        
        // Update the widget with changed properties
        this.update(widget, oldProps, changedProps);
        
        // Update common properties
        this.initOrUpdateCommonProperties(widget, changedProps);
    }

    private initOrUpdateCommonProperties(widget: UE.Widget, changeProps: any) {
        const styles = getAllStyles(this.typeName, changeProps);

        const translators: Record<string, ()=>any> = {
            "Cursor": () => {return parseCursor(styles?.cursor)},
            "RenderTransform": () => {return parseTransform(styles?.transform)},
            "RenderTransformPivot": () => {return parseTransformPivot(styles?.transformOrigin)},
            "Translate": () => {return parseTranslate(styles?.translate)},
            "RenderOpacity": () => {if (styles?.opacity) return safeParseFloat(styles?.opacity); else return null;},
            "Visibility": () => {return parseVisibility(styles?.visibility, changeProps?.hitTest)},
            "ToolTipText": () => {return changeProps?.toolTip ? changeProps.toolTip : changeProps?.title ? changeProps.title : null},
            "bIsEnabled": () => {return changeProps?.disable ? !changeProps.disable : true},
            "bIsVolatile": () => {return changeProps?.volatil ? changeProps.volatil : false},
            "PixelSnapping": () => {return changeProps?.pixelSnapping ? (changeProps.pixelSnapping ? UE.EWidgetPixelSnapping.SnapToPixel : UE.EWidgetPixelSnapping.Disabled) : null},
            "bIsEnabledDelegate": () => {return changeProps?.disableBinding ? () => {return !changeProps.disableBinding()} : null},
            "ToolTipTextDelegate": () => {return changeProps?.toolTipBinding ? changeProps.toolTipBinding : null},
            "VisibilityDelegate": () => {return changeProps?.visibilityBinding ? () => {return parseVisibility(changeProps.visibilityBinding())} : null},
        }

        for (const key in translators) {
            if (isKeyOfRecord(key, changeProps)) {
                const value = translators[key]();
                if (value) {
                    widget[key] = value;
                }
            }
        }
    }
}
const containerConverters: Record<string, any> = {
    "flex": FlexConverter,
    "grid": GridConverter,
    "overlay": OverlayConverter,
    "canvas": CanvasConverter,
}

export function createElementConverter(typeName: string, props: any): ElementConverter {
    if (isKeyOfRecord(typeName, containerConverters)) {
        return new containerConverters[typeName](typeName, props);
    }

    return null;
}
