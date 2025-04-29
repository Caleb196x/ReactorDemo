import * as UE from 'ue';
import { JSXConverter } from './jsx_converter';

/**
 * 支持的图片源src类型：
 * 1. 本地图片路径； 2. 网络图片路径； 3. UE纹理资源路径；4. 材质资源；
 * 图片资源的加载方式均采用异步加载的方式进行。
 */
export class ImageConverter extends JSXConverter {
    private source: string;
    private width: number;
    private height: number;
    private altText: string;
    private onLoad: ()=>void;
    private onError: ()=>void;

    constructor(typeName: string, props: any) {
        super(typeName, props);
        this.source = props?.src;
        this.width = props?.width;
        this.height = props?.height;
        this.altText = props?.alt;
        this.onLoad = props?.onLoad;
        this.onError = props?.onError;
    }

    createNativeWidget() {
        const image = new UE.Image();
        return image;
    }
    
    update(widget: UE.Widget, oldProps: any, changedProps: any) {
        const image = widget as UE.Image;
        if (changedProps.src && changedProps.src !== this.source) {

        }
    }
}
