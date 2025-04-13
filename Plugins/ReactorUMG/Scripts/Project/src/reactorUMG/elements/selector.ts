import * as UE from 'ue';
import { ComponentWrapper } from './common_wrapper';

// Component wrapper implementations
export class SelectWrapper extends ComponentWrapper {
    private onChangeCallback: (selectedItem: string, selectionType: UE.ESelectInfo) => void;
    private readonly propsReMapping: Record<string, string> = {
        'disabled': 'bIsEnabled',
        'onChange': 'OnSelectionChanged', 
        'defaultValue': 'SelectedOption'
    };

    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    private setupChangeHandler(comboBox: UE.ComboBoxString, onChange: Function) {
        if (typeof onChange === 'function') {
            this.onChangeCallback = (selectedItem: string, selectionType: UE.ESelectInfo) => {
                onChange({target: {value: selectedItem}});
            };
            comboBox.OnSelectionChanged.Add(this.onChangeCallback);
        }
    }

    private addOptions(comboBox: UE.ComboBoxString, children: any[]) {
        for (const child of children) {
            if (child.type === 'option') {
                const text = child.props.value ?? child.props.children;
                comboBox.DefaultOptions.Add(text);
                comboBox.AddOption(text);
            }
        }
    }

    private handleChildrenUpdate(comboBox: UE.ComboBoxString, oldChildren: any[], newChildren: any[]) {
        const oldChildNum = oldChildren.length;
        const newChildNum = newChildren.length;

        if (oldChildNum > newChildNum) {
            this.removeOptions(comboBox, oldChildren, newChildren);
        } else if (oldChildNum < newChildNum) {
            this.addNewOptions(comboBox, oldChildren, newChildren);
        }
    }

    private removeOptions(comboBox: UE.ComboBoxString, oldChildren: any[], newChildren: any[]) {
        const removeItems: string[] = [];
        for (let i = 0; i < oldChildren.length; i++) {
            if (oldChildren[i] in newChildren) continue;
            
            const text = oldChildren['value'] ?? oldChildren['children'];
            removeItems.push(text);
        }

        for (const item of removeItems) {
            comboBox.RemoveOption(item);
        }
    }

    private addNewOptions(comboBox: UE.ComboBoxString, oldChildren: any[], newChildren: any[]) {
        const addItems: string[] = [];
        for (let i = 0; i < newChildren.length; i++) {
            if (newChildren[i] in oldChildren) continue;
            
            const text = newChildren['value'] ?? newChildren['children'];
            addItems.push(text);
        }

        // todo@Caleb196x: update style
        for (const item of addItems) {
            comboBox.AddOption(item);
        }
    }

    override convertToWidget(): UE.Widget {
        if (this.typeName === "option") return null;

        const comboBox = new UE.ComboBoxString();
        const {children, defaultValue, disabled, onChange} = this.props;

        if (disabled) comboBox.bIsEnabled = false;

        this.addOptions(comboBox, children);
        this.setupChangeHandler(comboBox, onChange);
        comboBox.SelectedOption = defaultValue;
        
        this.commonPropertyInitialized(comboBox);
        
        return comboBox;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        if (this.typeName === "option") {
            console.log("Do not update anything for option");
            return false;
        }

        let propChange = false;
        const comboBox = widget as UE.ComboBoxString;

        for (const key in newProps) {
            const oldProp = oldProps[key];
            const newProp = newProps[key];

            if (oldProp === newProp) continue;

            propChange = true;

            if (key === 'children') {
                this.handleChildrenUpdate(comboBox, oldProps[key], newProps[key]);
            } else if (key === 'onChange' && typeof newProp === 'function') {
                comboBox.OnSelectionChanged.Remove(this.onChangeCallback);
                this.setupChangeHandler(comboBox, newProp);
            } else {
                updateProps[this.propsReMapping[key]] = newProp;
            }
        }

        this.commonPropertyInitialized(widget);
        return propChange;
    }

    override convertReactEventToWidgetEvent(reactProp: string, originCallback: Function): Function {
        return undefined;
    }
}