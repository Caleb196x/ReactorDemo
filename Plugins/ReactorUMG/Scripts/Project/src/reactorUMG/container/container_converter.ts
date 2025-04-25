import { ElementConverter } from "../converter";

export abstract class ContainerConverter extends ElementConverter {
    containerType: string;
    containerStyle: any;

    constructor(typeName: string, props: any) {
        super(typeName, props);
        
    }
    
    /**
     * 将容器参数以及布局参数转换中通用的功能实现在这个类中
     */
}
