import * as UE from 'ue';
import { ImageLoader } from '../misc/image_loader';
import { parseColor } from './css_color_parser';

export function parseBackgroundImage(backgroundImage: string, backgroundSize: string) : UE.SlateBrush | undefined {
    let brush = new UE.SlateBrush();
    brush.DrawAs = UE.ESlateBrushDrawType.Image;
    if (!backgroundImage) {
        return brush;
    }

    if (typeof backgroundImage !== 'string') {
        brush.ResourceObject = backgroundImage as UE.Texture2D;
        return brush;
    }

    let imagePath = backgroundImage;

    // Handle template literal with imported texture
    const templateMatch = backgroundImage.match(/`url\(\${(.*?)}\)`/);
    if (templateMatch && templateMatch[1]) {
        const textureName = templateMatch[1].trim();
        imagePath = textureName;
    }

    // Handle url() format if present
    const urlMatch = backgroundImage.match(/url\((.*?)\)/);
    if (urlMatch && urlMatch[1]) {
        imagePath = urlMatch[1].trim();
        // Remove quotes if present
        imagePath = imagePath.replace(/['"]/g, '');
    }
    // If not url() format, use the path directly
    else {
        imagePath = backgroundImage.trim();
        imagePath = imagePath.replace(/['"]/g, ''); // Still remove quotes if any
    }

    // Basic path validation
    if (!imagePath || imagePath.length === 0) {
        return null;
    }

    // Check for invalid characters in path
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(imagePath)) {
        console.warn(`Invalid characters in image path: ${imagePath}`);
        return null;
    }

    // Check file extension
    const validExtensions = ['.png', '.jpg', '.jpeg', '.bmp', '.tga'];
    const hasValidExtension = validExtensions.some(ext => 
        imagePath.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension) {
        console.warn(`Invalid image file extension: ${imagePath}`);
        return null;
    }

    // Check if file exists
    const texture = ImageLoader.loadTextureFromImagePath(imagePath);
    if (!texture) {
        console.warn(`Failed to load texture from image path: ${imagePath}`);
    } else {
        brush.ResourceObject = texture;
    }

    // parse backgroundSize
    if (backgroundSize) {
        const sizeValues = backgroundSize.split(' ');
        if (sizeValues.length === 1) {
            if (sizeValues[0] === 'cover' || sizeValues[0] === 'auto') {
                brush.Tiling = UE.ESlateBrushTileType.NoTile;
            } else if (sizeValues[0] === 'contain') {
                brush.Tiling = UE.ESlateBrushTileType.Both;
            } else {
                brush.ImageSize.X = Number(sizeValues[0]);
                brush.ImageSize.Y = Number(sizeValues[0]);
            }
        } else if (sizeValues.length === 2) {
            brush.Tiling = UE.ESlateBrushTileType.Both;
            brush.ImageSize.X = Number(sizeValues[0]);
            brush.ImageSize.Y = Number(sizeValues[1]);
        }
    }

    return brush;
}

export function parseBackgroundColor(backgroundColor: string) : UE.LinearColor {
    const color = parseColor(backgroundColor);
    return new UE.LinearColor(color.r / 255.0, color.g / 255.0, color.b / 255.0, color.a);
}

export function parseBackgroundRepeat(backgroundRepeat: string, image: UE.SlateBrush) : UE.SlateBrush {
    if (!image) {
        return image;
    }

    if (backgroundRepeat === 'no-repeat') {
        image.Tiling = UE.ESlateBrushTileType.NoTile;
    } else if (backgroundRepeat === 'repeat') {
        image.Tiling = UE.ESlateBrushTileType.Both;
    } else if (backgroundRepeat === 'repeat-x') {
        image.Tiling = UE.ESlateBrushTileType.Horizontal;
    } else if (backgroundRepeat === 'repeat-y') {
        image.Tiling = UE.ESlateBrushTileType.Vertical;
    }

    return image;
}

function parseBackgroundLayer(layer) {
    const REPEAT_KEYWORDS = {
        'repeat-x': 1, 'repeat-y': 1, 'repeat': 1,
        'space': 1, 'round': 1, 'no-repeat': 1
    };
      
    const ATTACHMENT_KEYWORDS = {
    'scroll': 1, 'fixed': 1, 'local': 1
    };
    
    const POSITION_KEYWORDS = new Set([
    'left', 'right', 'top', 'bottom', 'center'
    ]);

    const state = {
      color: 'none',
      image: 'none',
      position: 'none',
      size: 'none',
      repeat: 'none',
      attachment: 'scroll'
    };
  
    // 提取颜色（按规范应出现在最后）
    const colorMatch = layer.match(/(?:^|\s)(#[0-9a-fA-F]{3,8}|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*\d*\.?\d+)?\s*\)|hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(?:,\s*\d*\.?\d+)?\s*\)|\b[a-zA-Z]+\b)(?=\s*$)/);
    if (colorMatch) {
      state.color = colorMatch[1];
      layer = layer.slice(0, colorMatch.index).trim();
    }
  
    // 拆分 token（处理带空格的图片）
    const tokens = [];
    const regex = /(url\([^)]+\))/g;
    let match;
    while ((match = regex.exec(layer)) !== null) {
      tokens.push(match[1]);
    }
  
    // 解析其他属性
    let positionBuffer = [];
    let hasSlash = false;
  
    tokens.forEach(token => {
      if (token.startsWith('url(') || token.match(/^[\w-]+\(/)) {
        state.image = token;
      } else if (token === '/') {
        hasSlash = true;
      } else if (hasSlash) {
        state.size = token;
        hasSlash = false;
      } else if (token in REPEAT_KEYWORDS) {
        state.repeat = token;
      } else if (token in ATTACHMENT_KEYWORDS) {
        state.attachment = token;
      } else if (POSITION_KEYWORDS.has(token) || token.match(/^[\d%.]+$/)) {
        positionBuffer.push(token);
      }
    });
  
    // 处理位置/尺寸
    // fixme@Caleb196x: 解析的有点问题
    if (positionBuffer.length > 0) {
      const slashIndex = positionBuffer.indexOf('/');
      if (slashIndex > -1) {
        state.position = positionBuffer.slice(0, slashIndex).join(' ');
        state.size = positionBuffer.slice(slashIndex + 1).join(' ');
      } else {
        state.position = positionBuffer.join(' ');
      }
    }
  
    return state;
}

export function parseBackground(background: string) : any {
    // 1. 提取background中定义的background-color值
    // 2. 提取出background中定义的background-position值
    // 3. 提取出background中定义的background-repeat值
    // 4. 提取出background中定义的background-image值
    if (!background) {
        return {};
    }

    const { 
        color, 
        image, 
        position, 
        size, 
        repeat, 
        attachment 
    } = parseBackgroundLayer(background);

    let result = {};
    if (color !== 'none') {
        result['color'] = parseBackgroundColor(color);
    }

    if (image !== 'none') {
        result['image'] = parseBackgroundImage(image, size);
        result['repeat'] = parseBackgroundRepeat(repeat, result['image']);
    }

    if (position !== 'none') {
        result['position'] = parseBackgroundPosition(position);
    }

    return result;
}

export function parseBackgroundProps(style: any, childStyle?: any): any {
    // image转换成brush image
    // repeat转换成image中的tiling模式
    // position转换成alignment和padding

    let result = {};
    const background = style?.background;
    if (background) {
        result = parseBackground(background);
    }

    const backgroundColor = style?.backgroundColor;
    if (backgroundColor) {
        result['color'] = parseBackgroundColor(backgroundColor);
    }

    const backgroundImage = style?.backgroundImage;
    const backgroundSize = style?.backgroundSize;
    if (backgroundImage) {
        result['image'] = parseBackgroundImage(backgroundImage, backgroundSize);
    }

    const backgroundRepeat = style?.backgroundRepeat;
    if (backgroundRepeat && result['image']) {
        result['image'] = parseBackgroundRepeat(backgroundRepeat, result['image']);
    }

    // const backgroundPosition = style?.backgroundPosition;
    // if (backgroundPosition && result['image']) {
    //     result['alignment'] = parseBackgroundPosition(backgroundPosition);
    // }

    result['alignment'] = parseChildAlignment(childStyle);
    return result;
}