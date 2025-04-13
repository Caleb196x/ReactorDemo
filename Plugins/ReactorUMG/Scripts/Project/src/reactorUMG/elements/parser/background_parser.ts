import * as UE from 'ue';
import { convertLengthUnitToSlateUnit } from '../common_utils';

function isDirectionKeyword(value: string) : boolean {
    return ['top', 'bottom', 'left', 'right', 'center'].includes(value);
}

type Alignment = {horizontal: UE.EHorizontalAlignment, 
    vertical: UE.EVerticalAlignment, padding: UE.Margin};

const horizontalMap = {
    'left': UE.EHorizontalAlignment.HAlign_Left,
    'right': UE.EHorizontalAlignment.HAlign_Right,
    'center': UE.EHorizontalAlignment.HAlign_Center,
    '_': UE.EHorizontalAlignment.HAlign_Fill,
}

const verticalMap = {
    'top': UE.EVerticalAlignment.VAlign_Top,
    'bottom': UE.EVerticalAlignment.VAlign_Bottom,
    'center': UE.EVerticalAlignment.VAlign_Center,
    '_': UE.EVerticalAlignment.VAlign_Fill,
}

function parseTwoValueRules(parts: string[], result: Alignment): Alignment {
    if (parts.length !== 2) {
        throw new Error("Must be two values for background position");
    }

    let xAxis = { type: null, value: "0" }; // 类型：horizontal/vertical/value
    let yAxis = { type: null, value: "0" };

    // 解析每个部分的属性
    const parsePart = (part) => ({
        isHorizontal: ["left", "right"].includes(part),
        isVertical: ["top", "bottom"].includes(part),
        isCenter: part === "center",
        isNumeric: /^[\d%.]+$/.test(part)
    });

    const p1 = parsePart(parts[0]);
    const p2 = parsePart(parts[1]);

    // 规则 1: 两个关键字（必须水平+垂直）
    if ((p1.isHorizontal || p1.isVertical || p1.isCenter) && 
        (p2.isHorizontal || p2.isVertical || p2.isCenter)) 
    {
        xAxis.type = p1.isHorizontal ? "horizontal" : p2.isHorizontal ? "horizontal" : "value";
        yAxis.type = p1.isVertical ? "vertical" : p2.isVertical ? "vertical" : "value";

        xAxis.value = p1.isHorizontal || p1.isCenter ? parts[0] : 
                        p2.isHorizontal ? parts[1] : "center";
        yAxis.value = p1.isVertical || p1.isCenter ? parts[0] : 
                        p2.isVertical ? parts[1] : "center";
    }// 规则 2: 关键字 + 数值（顺序敏感）
    else if ((p1.isHorizontal && p2.isNumeric) || 
            (p1.isVertical && p2.isNumeric) || 
            (p1.isNumeric && p2.isVertical)) 
    {
        // 水平关键字 + 数值（如 "right 20px"）
        if (p1.isHorizontal) {
            xAxis = { type: "horizontal", value: parts[0] };
            yAxis = { type: "value", value: parts[1] };
        }
        // 数值 + 垂直关键字（如 "20% bottom"）
        else if (p2.isVertical) {
            xAxis = { type: "value", value: parts[0] };
            yAxis = { type: "vertical", value: parts[1] };
        }
        // 垂直关键字 + 数值（如 "top 10px"）
        else if (p1.isVertical) {
            xAxis = { type: "value", value: parts[1] };
            yAxis = { type: "vertical", value: parts[0] };
        }
    } // 规则 3: 两个数值（如 "30% 60%"）
    else if (p1.isNumeric && p2.isNumeric) {
        xAxis = { type: "value", value: parts[0] };
        yAxis = { type: "value", value: parts[1] };
    }

    // 映射到 UMG 参数
    const applyAxis = (axis, isHorizontal) => {
        if (axis.type === "horizontal") {
            result.horizontal = axis.value === "left" ? UE.EHorizontalAlignment.HAlign_Left : 
                                axis.value === "right" ? UE.EHorizontalAlignment.HAlign_Right : UE.EHorizontalAlignment.HAlign_Center;

            if (axis.value === "left") result.padding.Right = 0;
            if (axis.value === "right") result.padding.Left = 0;

        } else if (axis.type === "vertical") {
            result.vertical = axis.value === "top" ? UE.EVerticalAlignment.VAlign_Top : 
                            axis.value === "bottom" ? UE.EVerticalAlignment.VAlign_Bottom : UE.EVerticalAlignment.VAlign_Center;
            
            if (axis.value === "top") result.padding.Bottom = 0;
            if (axis.value === "bottom") result.padding.Top = 0;

        } else if (axis.type === "value") {
            if (isHorizontal) {
                result.horizontal = UE.EHorizontalAlignment.HAlign_Fill;
                if (axis.value === "center") {
                    result.horizontal = UE.EHorizontalAlignment.HAlign_Center;
                } else {
                    result.padding.Left = convertLengthUnitToSlateUnit(axis.value, undefined);
                    result.padding.Right = 0;
                }
            } else {
                result.vertical = UE.EVerticalAlignment.VAlign_Fill;
                if (axis.value === "center") {
                    result.vertical = UE.EVerticalAlignment.VAlign_Center;
                } else {
                    result.padding.Top = convertLengthUnitToSlateUnit(axis.value, undefined);
                    result.padding.Bottom = 0;
                }
            }
        }
    };

    applyAxis(xAxis, true);  // 处理 X 轴
    applyAxis(yAxis, false); // 处理 Y 轴

    return result;
}

function parseThreeAndFourValueRules(parts: string[], result: Alignment): Alignment {
    if (parts.length !== 3 && parts.length !== 4) {
        throw new Error("Must be three or four values for background position");
    }

    const isKeyword = str => /^(left|right|top|bottom|center)$/.test(str);
    const isHorizontalKeyword = k => ["left", "right", "center"].includes(k);
    const isVerticalKeyword = k => ["top", "bottom", "center"].includes(k);
    const isAxisCompatible = (k1, k2) => 
      (isHorizontalKeyword(k1) && isVerticalKeyword(k2)) ||
      (isVerticalKeyword(k1) && isHorizontalKeyword(k2));

    // 参数分组
    const groups = [];
    let currentGroup = [];
    for (const part of parts) {
        if (isKeyword(part)) {
        if (currentGroup.length > 0) groups.push(currentGroup);
            currentGroup = [part];
        } else {
            currentGroup.push(part);
        }
    }
    groups.push(currentGroup);

      // 验证分组结构
    if (groups.length !== 2 || groups.some(g => g.length > 2)) {
        throw new Error(`Invalid multi-value syntax: ${parts.join(" ")}`);
    }

    // 解析 X/Y 轴参数（兼容缺失的偏移量）
    const [xParts, yParts] = groups.map(g => ({
        key: g[0],
        offset: g[1] || "0px" // 三值语法时补充默认偏移量
    }));

    if (!isAxisCompatible(xParts.key, yParts.key)) {
        // using two value rules
        return parseTwoValueRules([parts[0], parts[1]], result);
    }

    // 处理 X/Y 轴参数
    const applyAxis = ({key, offset}, isHorizontal) => {
        if (isHorizontal) {
            result.horizontal = horizontalMap[key] || UE.EHorizontalAlignment.HAlign_Center;

            switch (key) {
                case 'left':
                    result.padding.Left = convertLengthUnitToSlateUnit(offset, undefined);
                    result.padding.Right = 0;
                    break;
                case 'right':
                    result.padding.Right = convertLengthUnitToSlateUnit(offset, undefined);
                    result.padding.Left = 0;
                    break;
                case 'center':
                    result.padding.Left = convertLengthUnitToSlateUnit(offset, undefined);
                    result.padding.Right = 0;
                    break;
                default:
                    result.padding.Left = convertLengthUnitToSlateUnit(offset, undefined);
                    result.padding.Right = 0;
            }
        } else {
            result.vertical = verticalMap[key] || UE.EVerticalAlignment.VAlign_Center;

            switch (key) {
                case 'top':
                    result.padding.Top = convertLengthUnitToSlateUnit(offset, undefined);
                    result.padding.Bottom = 0;
                    break;
                case 'bottom':
                    result.padding.Bottom = convertLengthUnitToSlateUnit(offset, undefined);
                    result.padding.Top = 0;
                    break;
                case 'center':
                    result.padding.Top = convertLengthUnitToSlateUnit(offset, undefined);
                    result.padding.Bottom = 0;
                    break;
                default:
                    result.padding.Top = convertLengthUnitToSlateUnit(offset, undefined);
                    result.padding.Bottom = 0;
            }
        }
    }

    applyAxis(xParts, true);
    applyAxis(yParts, false);

    return result;
}

export function parseBackgroundPosition(backgroundPosition: string) : any {
    const parts = backgroundPosition.split(/[\s,]+/).filter(p => p !== "");
    console.log(parts);
    let result: Alignment = {
        horizontal: UE.EHorizontalAlignment.HAlign_Center,
        vertical: UE.EVerticalAlignment.VAlign_Center,
        padding: new UE.Margin(0, 0, 0, 0)
    }

    if (parts.length === 1) {
        if (isDirectionKeyword(parts[0])) {
            result.horizontal = horizontalMap[parts[0]] || UE.EHorizontalAlignment.HAlign_Center;
            result.vertical = verticalMap[parts[0]] || UE.EVerticalAlignment.VAlign_Center;
        } else {
            result.horizontal = UE.EHorizontalAlignment.HAlign_Fill;
            result.vertical = UE.EVerticalAlignment.VAlign_Center;
            const length = convertLengthUnitToSlateUnit(parts[0], undefined);
            result.padding.Left = length;
        }
    } else if (parts.length === 2) {
        result = parseTwoValueRules(parts, result);
    } else if (parts.length === 3 || parts.length === 4) {
        result = parseThreeAndFourValueRules(parts, result);
    }
    
    return result;
}
