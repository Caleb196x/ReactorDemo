import * as UE from 'ue';
import * as CssType from 'csstype';
import { convertLengthUnitToSlateUnit, safeParseFloat } from '../common_utils';

function parseCursor(cursor: string) {
    if (!cursor) {
        return UE.EMouseCursor.Default;
    }

    switch (cursor) {
        case 'none':
            return UE.EMouseCursor.None;
        case 'text':
            return UE.EMouseCursor.TextEditBeam;
        case 'ew-resize':
        case 'col-resize':
            return UE.EMouseCursor.ResizeLeftRight;
        case 'ns-resize':
        case 'row-resize':
            return UE.EMouseCursor.ResizeUpDown;
        case 'se-resize':
            return UE.EMouseCursor.ResizeSouthEast;
        case 'sw-resize':
            return UE.EMouseCursor.ResizeSouthWest;
        case 'crosshair':
            return UE.EMouseCursor.Crosshairs;
        case 'pointer':
            return UE.EMouseCursor.Hand;
        case 'grab':
            return UE.EMouseCursor.GrabHand;
        case 'grabbing':
            return UE.EMouseCursor.GrabHandClosed;
        case 'not-allowed':
            return UE.EMouseCursor.SlashedCircle;
        case 'copy':
            return UE.EMouseCursor.EyeDropper;
        default:
            return UE.EMouseCursor.Default;
    }
}

function parseTransform(transform: CssType.Property.Transform ): {transform: UE.WidgetTransform, pivot: UE.Vector2D} {
    if (!transform) {
        return {
            transform: new UE.WidgetTransform(
                new UE.Vector2D(0, 0),
                new UE.Vector2D(1, 1),
                new UE.Vector2D(0, 0),
                0
            ),
            pivot: new UE.Vector2D(0.5, 0.5)
        };
    }

    const result = {
        translation: new UE.Vector2D(0, 0),
        scale: new UE.Vector2D(1, 1), 
        shear: new UE.Vector2D(0, 0),
        angle: 0,
        pivot: new UE.Vector2D(0.5, 0.5)
    };

    // Parse transform string like "translate(10px, 20px) rotate(45deg) scale(2)"
    const transformParts = transform.match(/\w+\([^)]+\)/g) || [];

    const parseAngle = (angle: string) => {
        if (!angle) return 0;
        
        // Extract numeric value and unit
        const match = angle.match(/^(-?\d*\.?\d+)(deg|rad|turn|grad)?$/);
        if (!match) return 0;

        const value = safeParseFloat(match[1]);
        const unit = match[2] || 'deg';

        // Convert to degrees based on unit
        switch (unit) {
            case 'rad':
                return value * 180 / Math.PI;
            case 'turn': 
                return value * 360;
            case 'grad':
                return value * 0.9;
            case 'deg':
            default:
                return value;
        }
    }

    transformParts.forEach(part => {
        const [property, ...values] = part.match(/[\w.-]+/g);
        
        switch (property) {
            case 'translate':
            case 'translate3d':
                result.translation.X = convertLengthUnitToSlateUnit(values[0] || '0px', {});
                result.translation.Y = convertLengthUnitToSlateUnit(values[1] || '0px', {});
                break;

            case 'translateX':
                result.translation.X = convertLengthUnitToSlateUnit(values[0] || '0px', {});
                break;

            case 'translateY': 
                result.translation.Y = convertLengthUnitToSlateUnit(values[0] || '0px', {});
                break;

            case 'scale':
            case 'scale3d':
                result.scale.X = safeParseFloat(values[0]);
                result.scale.Y = safeParseFloat(values[1] || values[0]);
                break;

            case 'scaleX':
                result.scale.X = safeParseFloat(values[0]);
                break;

            case 'scaleY':
                result.scale.Y = safeParseFloat(values[0]);
                break;

            case 'rotate':
            case 'rotateZ':
                result.angle = parseAngle(values[0]);
                break;

            case 'skew':
                result.shear.X = parseAngle(values[0]);
                result.shear.Y = parseAngle(values[1]);
                break;

            case 'skewX':
                result.shear.X = parseAngle(values[0]);
                break;

            case 'skewY':
                result.shear.Y = parseAngle(values[0]);
                break;
            case 'matrix':
                // matrix(a, b, c, d, tx, ty)
                // [a c tx]
                // [b d ty]
                // [0 0 1 ]
                result.scale.X = safeParseFloat(values[0]); // a - scale x
                result.scale.Y = safeParseFloat(values[3]); // d - scale y
                // Convert skew matrix values to angles in degrees (-90 to 90)
                result.shear.X = Math.max(-90, Math.min(90, safeParseFloat(values[2])) * 180 / Math.PI); // c - skew x angle
                result.shear.Y = Math.max(-90, Math.min(90, safeParseFloat(values[1])) * 180 / Math.PI); // b - skew y angle
                result.translation.X = safeParseFloat(values[4]); // tx - translate x
                result.translation.Y = safeParseFloat(values[5]); // ty - translate y
                break;

            case 'matrix3d':
                // matrix3d(a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, tx, ty, 0, 1)
                // Only use the 2D transformation components
                result.scale.X = safeParseFloat(values[0]); // a - scale x
                result.scale.Y = safeParseFloat(values[5]); // d - scale y
                result.shear.X = Math.max(-90, Math.min(90, safeParseFloat(values[4])) * 180 / Math.PI); // c - skew x angle
                result.shear.Y = Math.max(-90, Math.min(90, safeParseFloat(values[1])) * 180 / Math.PI); // b - skew y angle
                result.translation.X = safeParseFloat(values[12]); // tx - translate x
                result.translation.Y = safeParseFloat(values[13]); // ty - translate y
                break;
        }
    });

    return {
        transform: new UE.WidgetTransform(
            result.translation,
            result.scale,
            result.shear,
            result.angle
        ),
        pivot: result.pivot
    };

}

function parseTranslate(translate: CssType.Property.Translate) {
    if (!translate) {
        return new UE.WidgetTransform(
            new UE.Vector2D(0, 0),
            new UE.Vector2D(1, 1),
            new UE.Vector2D(0, 0),
            0
        );
    }

    // Split the translate value into components
    const values = translate.trim().split(' ');
    const x = values[0] || '0px';
    const y = values[1] || '0px';

    // Parse x and y values, handling percentages and units
    let translateX = convertLengthUnitToSlateUnit(x, {});
    let translateY = convertLengthUnitToSlateUnit(y, {});

    return new UE.WidgetTransform(
        new UE.Vector2D(translateX, translateY),
        new UE.Vector2D(1, 1), // No scale
        new UE.Vector2D(0, 0), // No shear
        0 // No rotation
    );
}

function parseRotate(rotate: CssType.Property.Rotate) {
    if (!rotate) {
        return new UE.WidgetTransform(
            new UE.Vector2D(0, 0),
            new UE.Vector2D(1, 1),
            new UE.Vector2D(0, 0),
            0
        );
    }

    // Extract numeric value and unit
    const match = rotate.match(/^(-?\d*\.?\d+)(deg|rad|turn|grad)?$/);
    if (!match) {
        return new UE.WidgetTransform(
            new UE.Vector2D(0, 0), 
            new UE.Vector2D(1, 1),
            new UE.Vector2D(0, 0),
            0
        );
    }

    const value = safeParseFloat(match[1]);
    const unit = match[2] || 'deg';

    // Convert to degrees based on unit
    let angle = 0;
    switch (unit) {
        case 'rad':
            angle = value * 180 / Math.PI;
            break;
        case 'turn':
            angle = value * 360;
            break;
        case 'grad':
            angle = value * 0.9;
            break;
        case 'deg':
        default:
            angle = value;
            break;
    }

    return new UE.WidgetTransform(
        new UE.Vector2D(0, 0),
        new UE.Vector2D(1, 1),
        new UE.Vector2D(0, 0),
        angle
    );
}

function parseVisibility(visibility: string) {
    if (!visibility) {
        return UE.ESlateVisibility.Visible;
    }

    switch (visibility) {
        case 'visible':
            return UE.ESlateVisibility.Visible;
        case 'hidden':
            return UE.ESlateVisibility.Hidden;
        case 'collapse':
        case 'collapsed':
            return UE.ESlateVisibility.Collapsed;
        case 'self-invisible':
            return UE.ESlateVisibility.SelfHitTestInvisible;
        case 'self-children-invisible':
            return UE.ESlateVisibility.HitTestInvisible;
        default:
            return UE.ESlateVisibility.Visible;
    }
}

function parseHitTest(hitTest: string) {
    if (!hitTest) {
        return UE.ESlateVisibility.Visible;
    }

    switch (hitTest) {
        case 'self-invisible':
            return UE.ESlateVisibility.SelfHitTestInvisible;
        case 'self-children-invisible':
            return UE.ESlateVisibility.HitTestInvisible;
        default:
            return UE.ESlateVisibility.Visible;
    }
}

export function convertCommonPropsToWidgetProps(props: any): any {
    if (!props) {
        return {};
    }

    const result = {};

    {
        const style = props?.style;
        const cursor = style?.cursor;
        if (cursor) {
            result['Cursor'] = parseCursor(cursor);
        }
    
        const transform = style?.transform;
        if (transform) {
            const {transform: parsedTransform, pivot} = parseTransform(transform);
            result['RenderTransform'] = parsedTransform;
            result['RenderTransformPivot'] = pivot;
        }
        
        const translate = style?.translate;
        if (translate) {
            result['RenderTransform'] = parseTranslate(translate);
        }
    
        const rotate = style?.rotate;
        if (rotate) {
            result['RenderTransform'] = parseRotate(rotate);
        }
    
        const opacity = style?.opacity;
        if (opacity) {
            result['RenderOpacity'] = safeParseFloat(opacity);
        }

        const visibility = style?.visibility;
        if (visibility) {
            result['Visibility'] = parseVisibility(visibility);
        }
    }

    const toolTip = props?.toolTip;
    if (toolTip) {
        result['ToolTipText'] = toolTip;
    }

    const title = props?.title;
    if (title) {
        result['ToolTipText'] = title;
    }

    const disable = props?.disable;
    if (disable) {
        result['bIsEnabled'] = !disable;
    }

    const hitTest = props?.hitTest;
    if (hitTest) {
        result['Visibility'] = parseHitTest(hitTest);
    }
    
    const volatil = props?.volatil;
    if (volatil) {
        result['bIsVolatile'] = volatil;
    }

    const pixelSnapping = props?.pixelSnapping;
    if (pixelSnapping) {
        result['PixelSnapping'] = pixelSnapping ? 
                UE.EWidgetPixelSnapping.SnapToPixel : UE.EWidgetPixelSnapping.Disabled;
    }

    const disableBinding = props?.disableBinding as () => boolean;
    if (disableBinding) {
        result['bIsEnabledDelegate'] = () => {return !disableBinding();};
    }

    const toolTipBinding = props?.toolTipBinding;
    if (toolTipBinding) {
        result['ToolTipTextDelegate'] = toolTipBinding;
    }

    const titleBinding = props?.titleBinding;
    if (titleBinding) {
        result['ToolTipTextDelegate'] = titleBinding;
    }

    const visibilityBinding = props?.visibilityBinding;
    if (visibilityBinding) {
        result['VisibilityDelegate'] = () => {
            return parseVisibility(visibilityBinding());
        };
    }

    return result;
}
