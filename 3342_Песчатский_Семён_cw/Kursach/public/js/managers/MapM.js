"use strict";

class MapManager {
    constructor() {
        this.currentMap = null;
        this.tiles = [];
        this.objects = [];
        this.properties = {};
        this.tileWidth = 32;
        this.tileHeight = 32;
        this.isLoaded = false;
        
        this.tilesets = [];
        this.tilesetData = null;
        this.tilesetImage = null;
        this.loadedImages = {};
        
        this.tileCanvasCache = null;
        this.isTileCanvasDirty = true;
        
        this.tileFrameMap = new Map();
    }
    
    init() {
        return Promise.resolve();
    }
    
    async loadMap(mapPath, tilesetJsonPath, tilesetImagePath) {
        try {
            const mapData = await this.loadJSON(mapPath);
            this.currentMap = mapData;
            
            if (tilesetJsonPath) {
                this.tilesetData = await this.loadJSON(tilesetJsonPath);
                this.buildTileFrameMap();
            }
            
            if (tilesetImagePath) {
                this.tilesetImage = await this.loadImage(tilesetImagePath);
            }
            
            this.parseMapData(mapData);
            
            this.isLoaded = true;
            this.isTileCanvasDirty = true;
            
            this.generateTileCanvas();
            
            console.log(`Карта загружена: ${this.tiles.length} тайлов`);
            return true;
            
        } catch (error) {
            console.error("Ошибка загрузки карты:", error);
            throw error;
        }
    }
    
    buildTileFrameMap() {
        if (!this.tilesetData || !this.tilesetData.frames) return;
        
        this.tileFrameMap.clear();
        
        this.tilesetData.frames.forEach(frame => {
            const tileNumber = parseInt(frame.filename);
            if (!isNaN(tileNumber)) {
                this.tileFrameMap.set(tileNumber, frame);
            }
        });
        
        console.log(`Построена карта тайлов: ${this.tileFrameMap.size} записей`);
    }
    
    async loadJSON(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText} для ${url}`);
        }
        return await response.json();
    }
    
    async loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = (err) => {
                console.error(`Ошибка загрузки изображения ${url}:`, err);
                reject(new Error(`Не удалось загрузить изображение: ${url}`));
            };
            img.src = url;
        });
    }
    
    parseMapData(mapData) {
        this.tiles = [];
        this.objects = [];
        this.properties = {};
        
        this.tileWidth = mapData.tilewidth || 32;
        this.tileHeight = mapData.tileheight || 32;
        
        if (mapData.tilesets) {
            mapData.tilesets.forEach(tileset => {
                this.tilesets.push({
                    firstgid: tileset.firstgid,
                    source: tileset.source
                });
            });
        }
        
        if (mapData.properties) {
            mapData.properties.forEach(prop => {
                this.properties[prop.name] = prop.value;
            });
        }
        
        mapData.layers.forEach((layer, index) => {
            if (layer.type === "tilelayer") {
                this.parseTileLayer(layer, mapData);
            }
        });
    }
    
    parseTileLayer(layer, mapData) {
        const mapWidth = layer.width || mapData.width;
        const mapHeight = layer.height || mapData.height;
        const tileData = layer.data;
        
        if (!tileData || tileData.length === 0) {
            return;
        }
        
        const isSolidLayer = layer.name === "Tile Layer 2";
        
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const tileIndex = y * mapWidth + x;
                const gid = tileData[tileIndex];
                
                if (gid > 0) {
                    const frameData = this.getFrameForGid(gid);
                    const tileInfo = {
                        x: x * this.tileWidth,
                        y: y * this.tileHeight,
                        width: this.tileWidth,
                        height: this.tileHeight,
                        gid: gid,
                        layer: layer.name,
                        frame: frameData,
                        solid: isSolidLayer, // Второй слой всегда твердый
                        visible: true,
                        tileset: this.getTilesetSourceForGid(gid)
                    };
                    
                    this.tiles.push(tileInfo);
                }
            }
        }
        
        console.log(`Слой "${layer.name}" загружен: ${this.tiles.length - (layer.name === "Tile Layer 1" ? 0 : this.tiles.filter(t => t.layer === "Tile Layer 1").length)} тайлов`);
    }
    
    getFrameForGid(gid) {
        const tileset = this.getTilesetForGid(gid);
        let localId = gid;
        
        if (tileset && tileset.firstgid > 0) {
            localId = gid - tileset.firstgid + 1; // +1 потому что Tiled использует 1-based индексы
        }
        
        if (this.tileFrameMap.has(localId)) {
            return this.tileFrameMap.get(localId);
        }
        
        if (this.tileFrameMap.has(gid)) {
            return this.tileFrameMap.get(gid);
        }
        
        console.warn(`Не найден фрейм для GID: ${gid} (localId: ${localId})`);
        return null;
    }
    
    getTilesetForGid(gid) {
        if (!this.tilesets || this.tilesets.length === 0) {
            return null;
        }
        
        let foundTileset = null;
        for (let i = this.tilesets.length - 1; i >= 0; i--) {
            const tileset = this.tilesets[i];
            if (gid >= tileset.firstgid) {
                foundTileset = tileset;
                break;
            }
        }
        
        return foundTileset;
    }
    
    getTilesetSourceForGid(gid) {
        const tileset = this.getTilesetForGid(gid);
        return tileset ? tileset.source : null;
    }
    
    generateTileCanvas() {
        if (!this.tiles.length || !this.tilesetImage) return;
        
        try {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;
            
            this.tiles.forEach(tile => {
                if (!tile.visible) return;
                
                minX = Math.min(minX, tile.x);
                minY = Math.min(minY, tile.y);
                maxX = Math.max(maxX, tile.x + tile.width);
                maxY = Math.max(maxY, tile.y + tile.height);
            });
            
            const mapWidth = maxX - minX;
            const mapHeight = maxY - minY;
            
            tempCanvas.width = mapWidth;
            tempCanvas.height = mapHeight;
            
            tempCtx.fillStyle = '#87CEEB';
            tempCtx.fillRect(0, 0, mapWidth, mapHeight);
            
            this.tiles.forEach(tile => {
                if (!tile.visible) return;
                
                if (tile.frame && this.tilesetImage) {
                    try {
                        const frame = tile.frame.frame;
                        tempCtx.drawImage(
                            this.tilesetImage,
                            frame.x, frame.y, frame.w, frame.h,
                            tile.x, tile.y, tile.width, tile.height
                        );
                        
                        if (GameConstants.DEBUG_MODE && tile.solid) {
                            tempCtx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
                            tempCtx.lineWidth = 1;
                            tempCtx.strokeRect(tile.x, tile.y, tile.width, tile.height);
                        }
                    } catch (error) {
                        console.error('Ошибка отрисовки тайла:', tile, error);
                    }
                } else {
                    tempCtx.fillStyle = tile.solid ? 'rgba(92, 184, 92, 0.5)' : 'rgba(204, 204, 204, 0.5)';
                    tempCtx.fillRect(tile.x, tile.y, tile.width, tile.height);
                }
            });
            
            this.tileCanvasCache = tempCanvas;
            this.isTileCanvasDirty = false;
            
            console.log(`Сгенерирован кэш тайлов: ${mapWidth}x${mapHeight}`);
            
        } catch (error) {
            console.error('Ошибка генерации canvas кэша:', error);
        }
    }
    
    render(context) {
        if (!this.isLoaded || !context) return;
        
        if (this.isTileCanvasDirty || !this.tileCanvasCache) {
            this.generateTileCanvas();
        }
        
        if (this.tileCanvasCache) {
            context.drawImage(this.tileCanvasCache, 0, 0);
        } else {
            this.tiles.forEach(tile => {
                if (!tile.visible) return;
                
                if (tile.frame && tile.frame.frame && this.tilesetImage) {
                    const frame = tile.frame.frame;
                    context.drawImage(
                        this.tilesetImage,
                        frame.x, frame.y, frame.w, frame.h,
                        tile.x, tile.y, tile.width, tile.height
                    );
                }
            });
        }
    }
    
    renderTile(context, tile) {
        if (!tile.visible) return;
        
        if (!tile.frame || !tile.frame.frame || !this.tilesetImage) {
            context.fillStyle = tile.solid ? 'rgba(92, 184, 92, 0.5)' : 'rgba(204, 204, 204, 0.5)';
            context.fillRect(tile.x, tile.y, tile.width, tile.height);
            return;
        }
        
        const frame = tile.frame.frame;
        context.drawImage(
            this.tilesetImage,
            frame.x, frame.y, frame.w, frame.h,
            tile.x, tile.y, tile.width, tile.height
        );
    }
    
    getTileAt(x, y) {
        return this.tiles.find(tile => {
            if (!tile.solid || !tile.visible) return false;
            
            return x >= tile.x && x < tile.x + tile.width &&
                   y >= tile.y && y < tile.y + tile.height;
        });
    }
    
    getCollidingTiles(rect) {
        return this.tiles.filter(tile => {
            if (!tile.solid || !tile.visible) return false;
            
            return GameUtils.checkCollision({
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height
            }, {
                x: tile.x,
                y: tile.y,
                width: tile.width,
                height: tile.height
            });
        });
    }
    
    getMapBounds() {
        if (!this.currentMap) {
            return {
                left: 0,
                right: 1440,
                top: 0,
                bottom: 800
            };
        }
        
        return {
            left: 0,
            right: this.currentMap.width * this.tileWidth,
            top: 0,
            bottom: this.currentMap.height * this.tileHeight
        };
    }
    
    clear() {
        this.tiles = [];
        this.objects = [];
        this.currentMap = null;
        this.isLoaded = false;
        this.tileCanvasCache = null;
        this.isTileCanvasDirty = true;
        this.tileFrameMap.clear();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapManager;
} else {
    window.MapManager = MapManager;
}