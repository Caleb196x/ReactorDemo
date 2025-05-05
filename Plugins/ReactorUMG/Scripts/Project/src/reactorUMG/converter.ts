import * as UE from 'ue';
import { findChangedProps, isKeyOfRecord, safeParseFloat } from './misc/utils';
import { getAllStyles } from './parsers/cssstyle_parser';
import { parseCursor, parseTransform, parseTransformPivot, parseTranslate, parseVisibility } from './parsers/common_props_parser';
import * as puerts from 'puerts';
export abstract class ElementConverter {
    typeName: string;
    props: any;

    constructor(typeName: string, props: any) {
        this.typeName = typeName;
        this.props = props;
    }

    abstract createNativeWidget(): UE.Widget;
    abstract update(widget: UE.Widget, oldProps: any, changedProps: any): void;
    abstract appendChild(parent: UE.Widget, child: UE.Widget, childTypeName: string, childProps: any): void;
    abstract removeChild(parent: UE.Widget, child: UE.Widget): void;
    creatWidget(): UE.Widget {
        let widget = this.createNativeWidget();
        this.initOrUpdateCommonProperties(widget, this.props);
        return widget;
    }

    updateWidget(widget: UE.Widget, oldProps: any, newProps: any) {
        // Find changed properties between oldProps and newProps
        const changedProps = findChangedProps(oldProps, newProps);
        // Update common properties
        this.initOrUpdateCommonProperties(widget, changedProps);
        // Update the widget with changed properties
        this.update(widget, oldProps, changedProps);
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

        const widgetProps = {};
        for (const key in translators) {
            if (isKeyOfRecord(key, changeProps)) {
                const value = translators[key]();
                if (value) {
                    widgetProps[key] = value;
                }
            }
        }

        if (styles){
            puerts.merge(widget, widgetProps);
            UE.UMGManager.SynchronizeWidgetProperties(widget);
        }
    }
}

const containerKeywords = ['div', 'Grid', 'Overlay', 'Canvas', 'canvas'];
const jsxComponentsKeywords = [
    'button', 'input', 'textarea', 'select', 'option', 'label', 'span', 'p', 'text',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'video', 'audio', 'progress'
];

export function createElementConverter(typeName: string, props: any): ElementConverter {
    if (containerKeywords.includes(typeName)) {
        const Module = require(`./container/container_converter`);
        if (Module) {
            return new Module["ContainerConverter"](typeName, props);
        }
    }

    if (jsxComponentsKeywords.includes(typeName)) {
        const Module = require(`./jsx/jsx_converter`);
        if (Module) {
            return new Module["JSXConverter"](typeName, props);
        }
    }

    const Module = require(`./umg/umg_converter`);
    if (Module) {
        return new Module["UMGConverter"](typeName, props);
    }
}
