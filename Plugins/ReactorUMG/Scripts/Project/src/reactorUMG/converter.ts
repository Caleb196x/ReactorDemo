import * as UE from 'ue';
import { findChangedProps, isEmpty, isKeyOfRecord, safeParseFloat } from './misc/utils';
import { getAllStyles } from './parsers/cssstyle_parser';
import { parseCursor, parseTransform, parseTransformPivot, parseTranslate, parseVisibility } from './parsers/common_props_parser';
import * as puerts from 'puerts';
export abstract class ElementConverter {
    typeName: string;
    props: any;
    outer: any;
    readonly PropMaps : Record<string, string>
    readonly translators: Record<string, (styles: any, changeProps: any)=>any>

    constructor(typeName: string, props: any, outer: any) {
        this.typeName = typeName;
        this.props = props;
        this.outer = outer;

        
        this.PropMaps = {
            "Cursor": "cursor",
            "RenderTransform": "transform",
            "RenderTransformPivot": "transformOrigin",
            "Translate": "translate",
            "RenderOpacity": "opacity",
            "Visibility": "visibility",
            "ToolTipText": "toolTip",
            "bIsEnabled": "disable",
            "bIsVolatile": "volatil",
            "PixelSnapping": "pixelSnapping",
            "bIsEnabledDelegate": "disableBinding",
            "ToolTipTextDelegate": "toolTipBinding",
            "VisibilityDelegate": "visibilityBinding",
        }

        this.translators = {
            "Cursor": (styles: any, changeProps: any) => {return parseCursor(styles?.cursor)},
            "RenderTransform": (styles: any, changeProps: any) => {return parseTransform(styles?.transform)},
            "RenderTransformPivot": (styles: any, changeProps: any) => {return parseTransformPivot(styles?.transformOrigin)},
            "Translate": (styles: any, changeProps: any) => {return parseTranslate(styles?.translate)},
            "RenderOpacity": (styles: any, changeProps: any) => {if (styles?.opacity) return safeParseFloat(styles?.opacity); else return null;},
            "Visibility": (styles: any, changeProps: any) => {return parseVisibility(styles?.visible || styles?.visibility, changeProps?.hitTest)},
            "ToolTipText": (changeProps: any) => {return changeProps?.toolTip || changeProps?.title || null},
            "bIsEnabled": (changeProps: any) => {return changeProps?.disable ? !changeProps.disable : true},
            "bIsVolatile": (changeProps: any) => {return changeProps?.volatil ? changeProps.volatil : false},
            "PixelSnapping": (changeProps: any) => {return changeProps?.pixelSnapping ? (changeProps.pixelSnapping ? UE.EWidgetPixelSnapping.SnapToPixel : UE.EWidgetPixelSnapping.Disabled) : null},
            "bIsEnabledDelegate": (changeProps: any) => {return changeProps?.disableBinding ? () => {return !changeProps.disableBinding()} : null},
            "ToolTipTextDelegate": (changeProps: any) => {return changeProps?.toolTipBinding ? changeProps.toolTipBinding : null},
            "VisibilityDelegate": (changeProps: any) => {return changeProps?.visibilityBinding ? () => {return parseVisibility(changeProps.visibilityBinding())} : null},
        }
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

        const widgetProps = {};
        for (const key in this.translators) {
            const propName = this.PropMaps[key];
            if (isKeyOfRecord(propName, styles) || isKeyOfRecord(propName, changeProps)) {
                const value = this.translators[key](styles, changeProps);
                if (value !== null) {
                    widgetProps[key] = value;
                }
            }
        }

        if (!isEmpty(widgetProps)) {
            puerts.merge(widget, widgetProps);
            UE.UMGManager.SynchronizeWidgetProperties(widget);
        }
    }
}

const containerKeywords = ['div', 'Grid', 'Overlay', 'Canvas', 'canvas', 'label', 'form', 'section', 'article', 'main', 'header', 'footer'];
const jsxComponentsKeywords = [
    'button', 'input', 'textarea', 'select', 'option', 'label', 'span', 'p', 'text',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'video', 'audio', 'progress'
];

export function createElementConverter(typeName: string, props: any, outer: any): ElementConverter {
    if (containerKeywords.includes(typeName)) {
        const Module = require(`./container/container_converter`);
        if (Module) {
            return new Module["ContainerConverter"](typeName, props, outer);
        }
    }

    if (jsxComponentsKeywords.includes(typeName)) {
        const Module = require(`./jsx/jsx_converter`);
        if (Module) {
            return new Module["JSXConverter"](typeName, props, outer);
        }
    }

    const Module = require(`./umg/umg_converter`);
    if (Module) {
        return new Module["UMGConverter"](typeName, props, outer);
    }
}
