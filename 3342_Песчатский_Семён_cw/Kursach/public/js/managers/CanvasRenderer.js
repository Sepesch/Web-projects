"use strict";

class CanvasRenderer {
    constructor() {
        this.canvas = null;
        this.context = null;
        this.tilesCanvas = null;
        this.tilesContext = null;
        this.spritesCanvas = null;
        this.spritesContext = null;
        this.isInitialized = false;
        
        this.tileCache = new Map();
        this.spriteCache = new Map();
        
        this.drawCalls = 0;
        this.fps = 0;
        this.lastFrameTime = 0;
    }
    
    init() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }
        
        this.context = this.canvas.getContext('2d');
        
        this.tilesCanvas = document.getElementById('tilesCanvas') || document.createElement('canvas');
        this.tilesContext = this.tilesCanvas.getContext('2d');
        
        this.spritesCanvas = document.getElementById('spritesCanvas') || document.createElement('canvas');
        this.spritesContext = this.spritesCanvas.getContext('2d');
        
        this.context.imageSmoothingEnabled = false;
        this.tilesContext.imageSmoothingEnabled = false;
        this.spritesContext.imageSmoothingEnabled = false;
        
        this.isInitialized = true;
        console.log("CanvasRenderer инициализирован");
    }
    
    render(gameState) {
        if (!this.isInitialized || !gameState) return;
        
        this.drawCalls = 0;
        
        this.clear();
        
        this.renderBackground(gameState);
        this.renderTiles(gameState);
        this.renderEntities(gameState);
        this.renderUI(gameState);
        
        if (GameConstants.DEBUG_MODE) {
            this.renderDebugInfo(gameState);
        }
    }
    
    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    renderBackground(gameState) {
        this.context.fillStyle = '#87CEEB';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    renderTiles(gameState) {
        if (!gameState.mapManager || !gameState.mapManager.tiles) return;
        
        const tiles = gameState.mapManager.tiles;
        gameState.mapManager.render(this.context);
    }
    
    
    renderEntities(gameState) {
        if (!gameState.entities) return;
        
        const sortedEntities = [...gameState.entities].sort((a, b) => a.y - b.y);
        
        for (const entity of sortedEntities) {
            if (entity.isActive && !entity.isDestroyed) {
                this.drawEntity(entity);
            }
        }
    }
    
    drawEntity(entity) {
        if (entity.spriteName && spriteManager) {
            const spriteData = spriteManager.getSprite(entity.spriteName);
            if (spriteData && spriteData.image) {
                this.drawSprite(entity, spriteData);
                return;
            }
        }
        
    }
    
    drawSprite(entity, spriteData) {
        const frame = spriteData.frame;
        const image = spriteData.image;
        
        this.context.save();
        
        this.context.translate(entity.x + entity.width / 2, entity.y + entity.height / 2);
        
        if (entity.direction === -1) {
            this.context.scale(-1, 1);
        }
        
        this.context.drawImage(
            image,
            frame.x, frame.y, frame.w, frame.h,
            -entity.width / 2, -entity.height / 2,
            entity.width, entity.height
        );
        
        this.context.restore();
        
        this.drawCalls++;
        
        if (GameConstants.DEBUG_MODE) {
            this.context.strokeStyle = '#ff0000';
            this.context.lineWidth = 1;
            this.context.strokeRect(entity.x, entity.y, entity.width, entity.height);
        }
    }
    
    renderUI(gameState) {
        this.context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.context.fillRect(10, 10, 200, 80);
        
        this.context.fillStyle = '#ffffff';
        this.context.font = '16px Arial';
        
        this.context.fillText(`Уровень: ${gameState.currentLevel}`, 20, 35);
        this.context.fillText(`Жизни: ${gameState.lives}`, 20, 60);
        this.context.fillText(`Очки: ${gameState.score}`, 20, 85);
        
        if (gameState.isPaused) {
            this.context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.context.fillStyle = '#ffffff';
            this.context.font = '48px Arial';
            this.context.textAlign = 'center';
            this.context.fillText('ПАУЗА', this.canvas.width / 2, this.canvas.height / 2);
            this.context.textAlign = 'left';
        }
    }
    
    renderDebugInfo(gameState) {
        this.context.fillStyle = '#000';
        this.context.font = '12px Arial';
        
        const now = performance.now();
        this.fps = Math.round(1000 / (now - this.lastFrameTime));
        this.lastFrameTime = now;
        
        this.context.fillText(`FPS: ${this.fps}`, 10, this.canvas.height - 60);
        this.context.fillText(`Draw Calls: ${this.drawCalls}`, 10, this.canvas.height - 45);
        this.context.fillText(`Entities: ${gameState.entities?.length || 0}`, 10, this.canvas.height - 30);
        
        if (gameState.player) {
            this.context.fillText(
                `Player: (${Math.round(gameState.player.x)}, ${Math.round(gameState.player.y)})`, 
                10, 
                this.canvas.height - 15
            );
        }
    }
    
    drawText(text, x, y, options = {}) {
        const {
            fontSize = 16,
            fontFamily = 'Arial',
            color = '#ffffff',
            align = 'left',
            baseline = 'top'
        } = options;
        
        this.context.save();
        this.context.fillStyle = color;
        this.context.font = `${fontSize}px ${fontFamily}`;
        this.context.textAlign = align;
        this.context.textBaseline = baseline;
        this.context.fillText(text, x, y);
        this.context.restore();
    }
    
    drawRoundedRect(x, y, width, height, radius = 5) {
        this.context.beginPath();
        this.context.moveTo(x + radius, y);
        this.context.lineTo(x + width - radius, y);
        this.context.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.context.lineTo(x + width, y + height - radius);
        this.context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.context.lineTo(x + radius, y + height);
        this.context.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.context.lineTo(x, y + radius);
        this.context.quadraticCurveTo(x, y, x + radius, y);
        this.context.closePath();
    }
    
    clearCache() {
        this.tileCache.clear();
        this.spriteCache.clear();
    }
    
    resize(width, height) {
        if (!this.canvas) return;
        
        this.canvas.width = width;
        this.canvas.height = height;
    }
    
    getContext() {
        return this.context;
    }
    
    getDimensions() {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasRenderer;
} else {
    window.CanvasRenderer = CanvasRenderer;
}