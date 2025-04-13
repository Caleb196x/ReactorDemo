import * as UE from 'ue';
import * as puerts from 'puerts'
import { convertCommonPropsToWidgetProps } from './parser/common_props_parser';

// Base abstract class for all component wrappers
export abstract class ComponentWrapper {
    typeName: string;
    props: any;

    abstract convertToWidget(): UE.Widget;
    abstract updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean;
    convertReactEventToWidgetEvent(reactProp: string, originCallback: Function): Function {
        return undefined;
    }

    commonPropertyInitialized(widget: UE.Widget) {
        const widgetProps = convertCommonPropsToWidgetProps(this.props);
        puerts.merge(widget, widgetProps);
        UE.UMGManager.SynchronizeWidgetProperties(widget);
    }

    appendChildItem(parentItem: UE.Widget, childItem: UE.Widget, childItemTypeName: string, childProps?: any) {
        // Default empty implementation
    }
}