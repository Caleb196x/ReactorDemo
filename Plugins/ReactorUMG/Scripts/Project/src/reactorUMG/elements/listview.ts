import * as UE from 'ue';
import { ComponentWrapper } from './common_wrapper';
import { CreateReactComponentWrapper } from '../base_components';

export class ListViewWrapper extends ComponentWrapper {
    private listItemType: string;
    private listView: UE.ListView;
    private listItems: UE.Widget[];
    private widgetNameToObject: Record<string, UE.Widget>;
    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
        this.listItemType = '';
        this.listView = undefined;
        this.listItems = [];
        this.widgetNameToObject = {};
    }

    checkAllItemTypeIsSame(): string {
        let children = this.props.children;
        let itemType = '';
        for (var key in children) {
            let item = children[key]['props']['children'];
            let currItemType = item['type'];

            if (itemType === '') {
                itemType = currItemType 
            }

            if (itemType !== currItemType) {
                throw new Error('list item type must be same!');
            }
        }

        return itemType;
    }

    override convertToWidget(): UE.Widget {
        if (this.typeName === 'li') {
            // 读取children，如果是子标签，那么创建wrapper，然后调用convertToWidget创建对应的Widget
            if (typeof this.props.children === 'string') {
                let textWidget = new UE.TextBlock();
                textWidget.SetText(this.props.children);
                return textWidget;
            } else {
                
                let child = this.props.children;
                let childType = child['type'];

                if (this.listItemType === '') {
                    this.listItemType = childType;
                }

                if (this.listItemType !== childType) {
                    throw new Error('list item type must be same!');
                }

                let component = CreateReactComponentWrapper(childType, child.props);
                return component.convertToWidget();
            }
        } else if (this.typeName === 'ul') {
            this.listView = new UE.ListView();
            
            // check all items' type is the same
            let buttonClass: UE.UserWidget = UE.UserWidget.Load('/Game/Button.Button');
            // this.listView.EntryWidgetClass = buttonClass.StaticClass();
            this.commonPropertyInitialized(this.listView);
            // todo@Caleb196x: support style
            return this.listView;
        }

        return undefined;
    }

    override appendChildItem(parentItem: UE.Widget, childItem: UE.Widget, childItemTypeName: string, childProps?: any) {
        if (childItemTypeName === this.listItemType) {
            this.listView.AddItem(childItem);
        }
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps : any, newProps: any, updateProps: Record<string, any>) : boolean {
        
        if (this.typeName === 'li') {

        } else if (this.typeName === 'ul') {
            // todo@Caleb196x: 增加或者删除Item，需要额外信息标记已添加了哪些Item
            // 1. 通过对比新旧props中item的数量
            // 2. 如果数量减少，找出新旧props中的item，然后删除
            // 3. 如果数量增加，找出新旧props中的item，然后添加
            let oldChildren = oldProps['children'];
            let newChildren = newProps['children'];
            if (oldChildren.length > newChildren.length) {
                // todo@Caleb196x: 删除
            } else if (oldChildren.length < newChildren.length) {
                // todo: 增加item
            }
        }

        return;
    }

    override convertReactEventToWidgetEvent(reactProp: string, originCallback: Function) : Function {
        return undefined;
    }
}