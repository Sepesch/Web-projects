"use strict";

class Projectile extends Entity {
    constructor(x, y, direction, owner) {
        super(x, y, 16, 16, 16);
        
        this.type = 'projectile';
        this.owner = owner;
        this.direction = direction;
        
        this.speed = 300;
        this.damage = 1;
        
        this.vx = this.speed * this.direction;
        this.vy = 0;
        
        this.spriteName = 'Bullet.Base.png';
        
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        super.update(deltaTime);
        
        this.checkTileCollisions();
        this.checkOutOfBounds();
    }
    
    checkTileCollisions() {
        if (!mapManager) return;
        
        const middleX = this.x + this.width / 2;
        const middleY = this.y + this.height / 2;
        const tile = mapManager.getTileAt(middleX, middleY);
        
        if (tile && tile.solid) {
            this.destroy();
        }
    }
    
    checkOutOfBounds() {
        if (this.x < -16 || this.x > 1446 || this.y < -16 || this.y > 816) {
            this.destroy();
        }
    }
    
    destroy() {
        super.destroy();
    }
    explode(){
        
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Projectile;
} else {
    window.Projectile = Projectile;
}