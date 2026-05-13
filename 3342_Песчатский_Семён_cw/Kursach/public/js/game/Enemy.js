"use strict";

class Enemy extends Entity {
    constructor(x, y) {
        super(x, y, 64, 64, 50);
        
        this.type = 'enemy';
        this.speed = 50;
        this.direction = -1;
        
        this.health = 3;
        this.damage = 1;
        
        this.isGrounded = false;
        this.Status = "idle";
        this.animCycle = 0;
        this.onSlope = "no";
        
        this.changeDirectionTimer = 0;
        this.shootCooldown = 0;
        this.shootTimer = 0;
        
        this.AnimationTimer = performance.now();
        
        this.setSprite('Enemy.Idle-0.png');
        
    }
    
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        super.update(deltaTime);
        
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
        
        this.updateBehavior(deltaTime);
        
        var previousStatus = this.Status;
        if(this.shootCooldown - 1.75 < 0){
            if(!this.isGrounded){this.Status = 'jumping';}
            else if(Math.abs(this.vx) > 0.1){this.Status = 'walking';}
            else{this.Status = 'idle';}
        }
        
        if(previousStatus != this.Status){this.animCycle=0;}
        
        this.checkTileCollisions();
        this.updateAnimation();
    }
    
    updateBehavior(deltaTime) {
        this.vx = this.direction * this.speed;
        
        this.changeDirectionTimer -= deltaTime;
        if (this.changeDirectionTimer <= 0) {
            this.direction *= -1;
            this.changeDirectionTimer = 2 + Math.random() * 3;
        }
        
        this.shootTimer -= deltaTime;
        if (this.shootTimer <= 0) {
            if (Math.random() < 0.3 && this.shootCooldown <= 0) {
                this.shoot();
            }
            this.shootTimer = 1;
        }
    }
    
    shoot() {
        if (this.shootCooldown > 0) return;
        this.Status = 'shoot'
        this.shootCooldown = 2;
        
        const projectileX = this.x + (this.direction === 1 ? this.width : 0);
        const projectileY = this.y + this.height / 2 - 8;
        
        const projectile = new Projectile(
            projectileX,
            projectileY,
            this.direction,
            'enemy'
        );
        
        projectile.setSprite('Bullet.Base.png');
        
        if (gameManager) {
            gameManager.addEntity(projectile);
            
        }
        
        if (soundManager) {
            soundManager.play('enemyShoot');
        }
    }
    
    checkTileCollisions() {
        if (!mapManager) return;
        
        const bottomY = this.y + this.height + 1;
        const bottomLeftTile = mapManager.getTileAt(this.x + 28, bottomY);
        const bottomRightTile = mapManager.getTileAt(this.x + 36, bottomY);
        
        this.isGrounded = (bottomLeftTile && bottomLeftTile.solid) || (bottomRightTile && bottomRightTile.solid);
        
        if (this.isGrounded && this.vy > 0) {
            this.vy = 0;
        }
        
        // Проверка сверху
        const topY = this.y - 1;
        const topTile = mapManager.getTileAt(this.x + 36, topY);
        
        if ((topTile && topTile.solid)) {
            if (this.vy < 0) {
                this.vy = 0;
            }
        }
        
        this.onSlope = "no";
        
        // Проверка слева
        const leftX = this.x + 24;
        const leftTopTile = mapManager.getTileAt(leftX, this.y + 34);
        const leftBottomTile = mapManager.getTileAt(leftX, this.y + this.height - 1);
        
        if((!leftTopTile || (leftTopTile && !leftTopTile.solid)) && (leftBottomTile && leftBottomTile.solid)){
           if(this.vx < 0){
            this.onSlope = "left";
           }
        } else {
            if ((leftTopTile && leftTopTile.solid) || (leftBottomTile && leftBottomTile.solid)) {
                if (this.vx < 0) {
                    this.vx = 0;
                    this.direction = 1;
                    this.changeDirectionTimer = 1;
                }
            }
        }

        // Проверка справа
        const rightX = this.x + 40;
        const rightTopTile = mapManager.getTileAt(rightX, this.y + 32);
        const rightBottomTile = mapManager.getTileAt(rightX, this.y + this.height - 1);
        
        if((!rightTopTile || (rightTopTile && !rightTopTile.solid)) && (rightBottomTile && rightBottomTile.solid)) { 
            if(this.vx > 0){
                this.onSlope = "right";
            }
        } else {
            if ((rightTopTile && rightTopTile.solid) || (rightBottomTile && rightBottomTile.solid)) {
                if (this.vx > 0) {
                    this.vx = 0;
                    this.direction = -1;
                    this.changeDirectionTimer = 1;
                }
            }
        }
        
        // Простая проверка на обрыв
        const edgeCheckX = this.x + (this.direction === 1 ? this.width + 20 : -20);
        const edgeTile = mapManager.getTileAt(edgeCheckX, this.y + this.height + 5);
        
        if (!edgeTile || !edgeTile.solid) {
            this.direction *= -1;
            this.changeDirectionTimer = 1;
        }
    }
    
    updateAnimation() {
        switch(this.Status){
            case 'idle':
                this.setSprite(`Enemy.Idle-${this.animCycle % 4}.png`);
                if(-this.AnimationTimer + performance.now() > 500){
                    this.animCycle++;
                    this.AnimationTimer = performance.now();
                }
                break;
            case 'walking':
                this.setSprite(`Enemy.Walk-${this.animCycle % 6}.png`);
                if(-this.AnimationTimer + performance.now() > 100){
                    this.animCycle++;
                    this.AnimationTimer = performance.now();
                }
                break;
            case 'shoot':
                this.setSprite(`Enemy.Shoot-${this.animCycle%4}.png`);
                    if(-this.AnimationTimer + performance.now()>50){
                        this.animCycle++;
                        this.AnimationTimer = performance.now();
                    };
                break;
            case 'death':
                this.setSprite(`Player.Death-${this.animCycle%4}.png`);
                if(this.animCycle < 4){
                        if(-this.AnimationTimer + performance.now()>50){
                        this.animCycle++;
                        this.AnimationTimer = performance.now();
                    };
                }
        }
    }
    
    onCollision(other) {
        if (!this.isActive || this.isDestroyed) return;
        
        switch (other.type) {
            case 'player':
                if (!other.invincible) {
                    other.takeDamage(this.damage);
                    this.direction = (this.x > other.x) ? 1 : -1;
                    this.changeDirectionTimer = 0.5;
                }
                break;
                
            case 'projectile':
                if (other.owner === 'player') {
                    gameManager.explode(other);
                    other.destroy();
                }
                break;
        }
    }
    
    takeDamage(amount) {
        if(this.health > 0){
            this.health -= amount;
            
            if (this.health <= 0) {
                this.onDeath();
                return;
            }
            
            this.damageEffectTimer = 0.1;
        
            if (gameManager && gameManager.player) {
                const player = gameManager.player;
                const direction = (this.x > player.x) ? 1 : -1;
                this.vx = direction * 100;
            }
        }
    }
    
    onDeath() {
        if (gameManager) {
            gameManager.addScore(100);
        }
        
        super.onDeath();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Enemy;
} else {
    window.Enemy = Enemy;
}