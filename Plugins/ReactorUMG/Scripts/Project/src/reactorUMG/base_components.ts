import * as UE from 'ue';
import * as puerts from 'puerts'
import { SelectWrapper } from './elements/selector';
import { ButtonWrapper } from './elements/button';
import { TextareaWrapper } from './elements/textarea';
import { ProgressBarWrapper } from './elements/progress_bar';
import { ImageWrapper } from './elements/image';
import { ListViewWrapper } from './elements/listview';
import { TextBlockWrapper } from './elements/textblock';
import { ContainerWrapper } from './elements/container/container';
import { InputWrapper } from './elements/input';
import { ComponentWrapper } from './elements/common_wrapper';
import { CanvasWrapper } from './elements/container/canvas';
import { OverlayWrapper } from './elements/overlay';
import { ScaleBoxWrapper } from './elements/scalebox';
import { UniformGridWrapper } from './elements/uniform_grid';
import { InvalidationBoxWrapper } from './elements/invalidation_box';
import { RetainerBoxWrapper } from './elements/retainer_box';
import { SafeZoneWrapper } from './elements/safezone';
import { SizeBoxWrapper } from './elements/sizebox';
import { BorderWrapper } from './elements/border';
import { ExpandableAreaWrapper } from './elements/expandable_area';
import { ThrobberWrapper } from './elements/throbber';
import { CircularThrobberWrapper } from './elements/circular_throbber';
import { ScrollBoxWrapper } from './elements/container/scrollbox';
import { SpacerWrapper } from './elements/spacer';
import { SliderWrapper } from './elements/slider';
import { RadialSliderWrapper } from './elements/radial_slider';
import { SpinBoxWrapper } from './elements/spinbox';
import { ComboBoxWrapper } from './elements/combo_box';
import { SpineWrapper } from './elements/spine';

import { CheckboxWrapper } from './elements/checkbox';
import { RiveWrapper } from './elements/rive';
const baseComponentsMap: Record<string, any> = {
    // base
    "select": SelectWrapper,
    "option": SelectWrapper,
    "button": ButtonWrapper,
    "textarea": TextareaWrapper,
    "progress": ProgressBarWrapper,
    "img": ImageWrapper,

    // 列表
    "ul": ListViewWrapper,
    "li": ListViewWrapper,

    // 富文本
    "article": TextBlockWrapper,
    "code": TextBlockWrapper,
    "mark": TextBlockWrapper,
    "a": TextBlockWrapper,
    "strong": TextBlockWrapper,
    "em": TextBlockWrapper,
    "del": TextBlockWrapper,

    // input
    "input": InputWrapper,
    
    // Text
    "span": TextBlockWrapper,
    "p": TextBlockWrapper,
    "text": TextBlockWrapper,
    "label": TextBlockWrapper,
    "h1": TextBlockWrapper,
    "h2": TextBlockWrapper,
    "h3": TextBlockWrapper,
    "h4": TextBlockWrapper,
    "h5": TextBlockWrapper,
    "h6": TextBlockWrapper,

    // container
    "div": ContainerWrapper,
    "view": ContainerWrapper,
    "canvas": CanvasWrapper,

    "Overlay": OverlayWrapper,
    "ScaleBox": ScaleBoxWrapper,
    "UniformGrid": UniformGridWrapper,
    "InvalidationBox": InvalidationBoxWrapper,
    "RetainerBox": RetainerBoxWrapper,
    "SafeZone": SafeZoneWrapper,
    "SizeBox": SizeBoxWrapper,

    "Border": BorderWrapper,
    "CircularThrobber": CircularThrobberWrapper,
    "Throbber": ThrobberWrapper,
    "Spacer": SpacerWrapper,
    "ExpandableArea": ExpandableAreaWrapper,
    "RadialSlider": RadialSliderWrapper,
    "Slider": SliderWrapper,
    "SpinBox": SpinBoxWrapper,
    "Button": ButtonWrapper,
    "ComboBox": ComboBoxWrapper,
    "Spine": SpineWrapper,
    "ProgressBar": ProgressBarWrapper,
    "Checkbox": CheckboxWrapper,
    "Rive": RiveWrapper,
};

function isKeyOfRecord(key: any, record: Record<string, any>): key is keyof Record<string, any> {
    return key in record;
}

function isEmpty(record: Record<string, any>): boolean {
    return Object.keys(record).length === 0;
}

export function CreateReactComponentWrapper(typeName: string, props: Record<string, any>) : ComponentWrapper {
    if (isKeyOfRecord(typeName, baseComponentsMap))
    {
        if (typeof baseComponentsMap[typeName] == 'string')
        {
            return undefined;
        }

        let wrapper = new baseComponentsMap[typeName](typeName, props);
        if (wrapper instanceof ComponentWrapper)
        {
            return wrapper;
        }
    }

    return undefined;
}

export function createUMGWidgetFromReactComponent(wrapper: ComponentWrapper) : UE.Widget {

    if (wrapper)
    {
        return wrapper.convertToWidget();
    }
    return undefined;
};

export function updateUMGWidgetPropertyUsingReactComponentProperty(widget: UE.Widget, wrapper: ComponentWrapper, oldProps : any, newProps: any) : boolean {
    let propsChange = false;
    let updateProps = {};

    if (wrapper)
    {
        propsChange = wrapper.updateWidgetProperty(widget, oldProps, newProps, updateProps);
    }

    if (propsChange && !isEmpty(updateProps))
    {
        puerts.merge(widget, updateProps);
    } else if (propsChange) {
        UE.UMGManager.SynchronizeWidgetProperties(widget)
    }

    return propsChange;
};

export function convertEventToWidgetDelegate(wrapper: ComponentWrapper, reactPropName: string, originCallback: Function) : Function {
    return wrapper.convertReactEventToWidgetEvent(reactPropName, originCallback);
}
