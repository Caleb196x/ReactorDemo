import * as UE from 'ue';
import { ComponentWrapper } from './common_wrapper';
import { parseColor } from './parser/color_parser';

export class SpineWrapper extends ComponentWrapper {
    constructor(type: string, props: any) {
        super();
        this.typeName = type;
        this.props = props;
    }

    override convertToWidget(): UE.Widget {
        const spine = new UE.SpineWidget();
        this.commonPropertyInitialized(spine);

        const initSkin = this.props?.initSkin as string;
        if (initSkin && initSkin !== '') {
            spine.SetSkin(initSkin);
        }

        const color = this.props?.color;
        if (color) {
            const rgba = parseColor(color);
            spine.Color.R = rgba.r;
            spine.Color.G = rgba.g;
            spine.Color.B = rgba.b;
            spine.Color.A = rgba.a;
        }

        let atlasLoaded = false;
        const atlas = this.props?.atlas;
        if (atlas) {
            spine.Atlas = UE.UMGManager.LoadSpineAtlas(spine, atlas);
            atlasLoaded = true;
        }

        const skel = this.props?.skel;
        if (skel) {
            spine.SkeletonData = UE.UMGManager.LoadSpineSkeleton(spine, skel);
            if (!atlasLoaded) {
                const atlasPath = skel.replace('.json', '.atlas').replace('.skel', '.atlas');
                spine.Atlas = UE.UMGManager.LoadSpineAtlas(spine, atlasPath);
                atlasLoaded = true;
            }
        }

        const initAnimation = this.props?.initAnimation;
        if (initAnimation && initAnimation !== '') {
            spine.SetAnimation(0, initAnimation, true);
        }

        const eventKeyMap: Record<string, string> = {
            'onAnimationStart': 'AnimationStart',
            'onAnimationEnd': 'AnimationEnd',
            'onAnimationComplete': 'AnimationComplete',
            'onAnimationEvent': 'AnimationEvent',
            'onAnimationInterrupt': 'AnimationInterrupt',
            'onAnimationDispose': 'AnimationDispose',
            'onBeforeUpdateWorldTransform': 'BeforeUpdateWorldTransform',
            'onAfterUpdateWorldTransform': 'AfterUpdateWorldTransform',
        }

        for (const [key, value] of Object.entries(this.props)) {
            if (eventKeyMap[key] && typeof value === 'function') {
                spine[eventKeyMap[key]].Add(value);
            }
        }
        
        UE.UMGManager.SynchronizeWidgetProperties(spine);

        return spine;
    }

    override updateWidgetProperty(widget: UE.Widget, oldProps: any, newProps: any, updateProps: Record<string, any>): boolean {
        return true;
    }
    
    
}
