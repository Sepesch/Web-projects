"use strict";

class Entity {
    constructor(x, y, width, height, spriteSize) {
        this.x = x;
        this.y = y;
        this.width = width || GameConstants.ENTITY_SIZE;
        this.height = height || GameConstants.ENTITY_SIZE;
        this.spriteSize = spriteSize;
        this.vx = 0;
        this.vy = 0;
        this.speed = 0;
        this.direction = 1; // 1 = вправо, -1 = влево
        
        this.isActive = true;
        this.isDestroyed = false;
        this.isCollidable = true;
        
        this.spriteName = null;
        this.type = 'entity';
    }
    
    
    update(deltaTime) {
        if (!this.isActive || this.isDestroyed) return;
        
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        if (this.type !== 'projectile') {
            this.vy += GameConstants.GRAVITY * deltaTime;
            
            if (this.vy > GameConstants.MAX_FALL_SPEED) {
                this.vy = GameConstants.MAX_FALL_SPEED;
            }
        }
        
        this.checkBounds();
    }
    
    
    checkBounds() {
        const bounds = mapManager.getMapBounds();
        if (this.type !== 'projectile') {
            if (this.x + 16 < bounds.left) {
                this.x = bounds.left - 16;
                this.vx = 0;
            }
            
            if (this.x + 48 > bounds.right) {
                this.x = bounds.right - 80;
                this.vx = 0;
            }
            
            if (this.y < bounds.top) {
                this.y = bounds.top;
                this.vy = 0;
            }

            if (this.y < 0) {
                this.y = 0;
                this.vy = 0;
            }
        }
    }
    
    onDeath() {
        this.destroy();
    }
    
    destroy() {
        this.isDestroyed = true;
        this.isActive = false;
    }
    
    getCollisionRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    setSprite(spriteName) {
        this.spriteName = spriteName;
        
        if (spriteManager) {
            const spriteData = spriteManager.getSprite(spriteName);
            if (spriteData) {
                this.width = spriteData.width;
                this.height = spriteData.height;
            }
        }
    }
    
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Entity;
} else {
    window.Entity = Entity;
}