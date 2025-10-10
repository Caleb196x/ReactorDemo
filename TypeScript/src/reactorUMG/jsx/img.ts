import * as UE from 'ue';
import { JSXConverter } from './jsx_converter';
import { ImageLoader } from '../misc/image_loader';
import { parseColor } from '../parsers/css_color_parser';

/**
 * 支持的图片源src类型：
 * 1. 本地图片路径； 2. 网络图片路径； 3. UE纹理资源路径；4. 材质资源；
 * 图片资源的加载方式均采用异步加载的方式进行。
 */
export class ImageConverter extends JSXConverter {
    private source: string;
    private width: number;
    private height: number;
    private color: string;
    private onClick: ()=>void;
    private image: UE.Image | undefined;

    constructor(typeName: string, props: any, outer: any) {
        super(typeName, props, outer);
        this.source = props?.src;
        this.width = props?.width;
        this.height = props?.height;
        this.color = props?.color;
        this.image = undefined;
        this.onClick = props?.onClick;
    }

    private onLoad(object: UE.Object) {
        if (this.image && object) {
            this.image.SetBrushResourceObject(object);
            if (this.props?.onLoad && 
                typeof this.props.onLoad === 'function') 
            {
                this.props.onLoad();
            }
        }
    }

    private onError() {
        if (this.props?.onError && 
            typeof this.props.onError === 'function') 
        {
            this.props.onError();
        }
    }

    createNativeWidget() {
        this.image = new UE.Image(this.outer);

        if (this.source) {
            ImageLoader.loadBrushImageObject(
                this.outer, this.source, __dirname, false, this.onLoad, this.onError
            );
        }

        let setupProps = false;
        if (this.width || this.height) {
            const actualWidth = this.width ? this.width : this.height;
            const actualHeight = this.height ? this.height : this.width;
            this.image.Brush.ImageSize.X = actualWidth;
            this.image.Brush.ImageSize.Y = actualHeight;
            setupProps = true;
        }

        if (this.color) {
            const rgba = parseColor(this.color);
            this.image.ColorAndOpacity.R = rgba.r;
            this.image.ColorAndOpacity.G = rgba.g;
            this.image.ColorAndOpacity.B = rgba.b;
            this.image.ColorAndOpacity.A = rgba.a;
            setupProps = true;
        }
        
        if (this.onClick) {
            this.image.OnMouseButtonDownEvent.Bind((MyGeometry, MouseEvent) => {
                this.onClick();
                return new UE.EventReply();
            });

            setupProps = true;
        }

        if (setupProps) {
            UE.UMGManager.SynchronizeWidgetProperties(this.image);
        }

        return this.image;
    }
    
    update(widget: UE.Widget, oldProps: any, changedProps: any) {
        if (changedProps.src && changedProps.src !== this.source) {
            const changedSrc = changedProps.src;
            ImageLoader.loadBrushImageObject(
                this.image, changedSrc, __dirname, false, this.onLoad, this.onError
            );
        }
    }
}
