"use strict";

class SpriteManager {
    constructor() {
        this.sprites = new Map();         
        this.spriteSheets = new Map();     
        this.animations = new Map();       
        this.isLoaded = false;
    }
    
    init() {
        return Promise.resolve();
    }
    
    
    async loadSpriteSheet(name, imageUrl, jsonUrl) {
        try {
            const [image, spriteData] = await Promise.all([
                this.loadImage(imageUrl),
                this.loadJSON(jsonUrl)
            ]);
            
            if (!spriteData.frames || !Array.isArray(spriteData.frames)) {
                throw new Error(`Неверный формат JSON для спрайтшита ${name}. Ожидается массив frames.`);
            }
            
            this.spriteSheets.set(name, {
                name: name,
                image: image,
                data: spriteData,
                imageUrl: imageUrl,
                jsonUrl: jsonUrl
            });
            this.cacheSprites(name, spriteData, image);
            
            console.log(`Спрайтшит "${name}" загружен: ${spriteData.frames.length} спрайтов`);
            this.isLoaded = true;
            return true;
            
        } catch (error) {
            console.error("Ошибка загрузки спрайтшита:", name, error);
            throw error;
        }
    }
    
    cacheSprites(sheetName, spriteData, image) {
        const frames = spriteData.frames;
        const meta = spriteData.meta || {};
        
        for (let i = 0; i < frames.length; i++) {
            const frameData = frames[i];
            const spriteName = frameData.filename || `sprite_${i}`;
            const cacheKey = `${sheetName}.${spriteName}`;
            this.sprites.set(cacheKey, {
                type: 'spriteSheet',
                sheet: sheetName,
                name: spriteName,
                fullName: cacheKey,
                image: image,
                imageUrl: image.src,
                
                frame: frameData.frame,
                rotated: frameData.rotated || false,
                trimmed: frameData.trimmed || false,
                spriteSourceSize: frameData.spriteSourceSize || frameData.frame,
                sourceSize: frameData.sourceSize || { w: frameData.frame.w, h: frameData.frame.h },
                
                sheetWidth: meta.size ? meta.size.w : image.width,
                sheetHeight: meta.size ? meta.size.h : image.height,
                
                width: frameData.frame.w,
                height: frameData.frame.h,
                
            });
        }
    }
    
    async loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(new Error(`Не удалось загрузить изображение: ${url}`));
            
            img.src = url;
        });
    }
    
    async loadJSON(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    }
    
    
    getSprite(spriteName) {

        if (this.sprites.has(spriteName)) {
            return this.sprites.get(spriteName);
        }
        
        if (spriteName.includes('.')) {
            const [sheetName, SpriteName] = spriteName.split('.');
            console.warn(`${SpriteName}.png`);
            if (this.sprites.has(`${SpriteName}.png`)) {
                return this.sprites.get(`${SpriteName}.png`);
            }
        }
        
        console.warn(`Спрайт "${spriteName}" не найден, создаем простой`);
        return 
    }
    
    
    
    getSpriteDimensions(spriteName) {
        const sprite = this.getSprite(spriteName);
        return {
            width: sprite?.width || 32,
            height: sprite?.height || 32
        };
    }
    
    getSpriteSheet(name) {
        return this.spriteSheets.get(name);
    }
    
    getAllSprites() {
        return Array.from(this.sprites.keys());
    }
    
    clear() {
        this.sprites.clear();
        this.spriteSheets.clear();
        this.animations.clear();
        this.isLoaded = false;
    }
    
    setSpriteOnElement(element, spriteName) {
        const spriteData = this.getSprite(spriteName);
        if (spriteData && element) {
            this.updateSpriteElement(element, spriteData);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpriteManager;
} else {
    window.SpriteManager = SpriteManager;
}