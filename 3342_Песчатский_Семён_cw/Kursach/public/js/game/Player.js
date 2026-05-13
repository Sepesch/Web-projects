"use strict";

class Player extends Entity {
    constructor(x, y) {
        super(x, y, GameConstants.PLAYER_SIZE, GameConstants.PLAYER_SIZE, 72);
        
        this.type = 'player';
        this.speed = GameConstants.PLAYER_SPEED;
        this.jumpForce = GameConstants.JUMP_FORCE;
        
        this.lives = 3;
        this.score = 0;
        this.ammo = 50;
        this.maxAmmo = 100;
        
        this.isGrounded = false;
        this.canDoubleJump = true;
        this.hasDoubleJumped = false;
        this.Status = "idle";
        this.animCycle = 0;
        this.onSlope = "no";

        this.shootCooldown = 0;        
        this.invincible = false;
        this.invincibleTimer = 0;
        this.AnimationTimer = performance.now();
        this.ShootTimer = 0;
        this.setSprite('Player.Idle-0.png');
    }
    
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        super.update(deltaTime);
        if(this.y > 800){
            this.onDeath();
        }
        this.handleInput(deltaTime);
        
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
        
        if (this.invincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            } else {
            }
        }
        var previousStatus = this.Status;
        if((performance.now() - this.ShootTimer)>200){
            if(!this.isGrounded){this.Status = 'jumping';}
            else if(Math.abs(this.vx) > 0.1){this.Status = 'walking';}
            else{this.Status = 'idle';}
        }

        if(previousStatus != this.Status){this.animCycle=0;}
        this.checkTileCollisions();
        this.updateAnimation();
    }
    
    handleInput(deltaTime) {
        if (!eventManager) return;
        
        this.vx = 0;
        
        if (eventManager.isKeyPressed('left')) {
            if(this.onSlope == 'left'){
                this.vy = -(this.speed/1.414);
                this.vx = -(this.speed/1.414);

            }
            else{
                this.vx = -this.speed;
            }
            
            this.direction = -1;
        }
        if (eventManager.isKeyPressed('right')) {

            if(this.onSlope == 'right'){
                this.vy = -(this.speed/1.414);
                this.vx = (this.speed/1.414)
            }
            else{
                this.vx = this.speed;
            }
            
            this.direction = 1;
        }
        
        if (eventManager.isKeyPressed('jump')) {
            this.jump();
        }
        
        if (eventManager.isKeyPressed('shoot') && this.shootCooldown <= 0) {
            this.shoot();
        }
    }
    
    jump() {
        if (this.isGrounded) {
            this.vy = -this.jumpForce;
            this.isGrounded = false;
            this.isJumping = true;
            this.hasDoubleJumped = false;
            
            if (soundManager) {
                soundManager.play('jump');
            }
            
        } else if (this.canDoubleJump && !this.hasDoubleJumped) {
            this.vy = -this.jumpForce * 0.8;
            this.hasDoubleJumped = true;
            
            if (soundManager) {
                soundManager.play('jump');
            }
        }
    }
    
    shoot() {
        this.Status = 'shoot';
        this.ShootTimer = performance.now();
        this.shootCooldown = GameConstants.SHOOT_DELAY;
        
        const projectileX = this.x + (this.direction === 1 ? this.width : 0);
        const projectileY = this.y + this.height / 2 - GameConstants.PROJECTILE_SIZE / 2;
        
        const projectile = new Projectile(
            projectileX,
            projectileY,
            this.direction,
            'player'
        );
        
        if (gameManager) {
            gameManager.addEntity(projectile);
            
            const container = document.getElementById('entitiesContainer');
            if (container) {
                container.appendChild(projectile.element);
            }
        }
        
        if (soundManager) {
            soundManager.play('shoot');

        }
        
    }
    
    checkTileCollisions() {
        if (!mapManager) return;
        const bottomY = this.y + this.height + 1;
        const bottomLeftTile = mapManager.getTileAt(this.x + 28, bottomY);
        const bottomRightTile = mapManager.getTileAt(this.x + 36, bottomY);
        // const underLeftTile = mapManager.getTileAt(this.x + 16, bottomY);
        // const underRightTile = mapManager.getTileAt(this.x + 48, bottomY);

        this.isGrounded = (bottomLeftTile && bottomLeftTile.solid) || (bottomRightTile && bottomRightTile.solid);
        
        if (this.isGrounded && this.vy > 0) {
            this.vy = 0;
            this.isJumping = false;
            this.hasDoubleJumped = false;
        }
        // this.underGrounded = underLeftTile && underLeftTile.solid && underRightTile && underRightTile.solid;
        // if(this.underGrounded){
        //     this.y = this.y - 1;
        // }
        // Проверка сверху (удар головой)
        const topY = this.y - 1;
        const topTile = mapManager.getTileAt(this.x + 36, topY);
        
        if ((topTile && topTile.solid)) {
            if (this.vy < 0) {
                this.vy = 0;
            }
        }
            this.onSlope = "no";
        
        const leftX = this.x + 24;
        const leftTopTile = mapManager.getTileAt(leftX, this.y + 34);
        const leftBottomTile = mapManager.getTileAt(leftX, this.y + this.height - 1);
        if((!leftTopTile || (leftTopTile && !leftTopTile.solid)) && (leftBottomTile && leftBottomTile.solid)){
           if(this.vx<0){
            this.onSlope = "left";
           }

        }
        else {if ((leftTopTile && leftTopTile.solid) || (leftBottomTile && leftBottomTile.solid)) {
            if (this.vx < 0) {
                this.vx = 0;
            }
        }
    }

        const rightX = this.x + 40;
        const rightTopTile = mapManager.getTileAt(rightX, this.y + 32);
        const rightBottomTile = mapManager.getTileAt(rightX, this.y + this.height - 1);
        if((!rightTopTile || (rightTopTile && !rightTopTile.solid)) && (rightBottomTile && rightBottomTile.solid))
        { 
            if(this.vx>0){
            this.onSlope = "right";
           }
        }
        else {if ((rightTopTile && rightTopTile.solid) || (rightBottomTile && rightBottomTile.solid)) {
            if (this.vx > 0) {
                this.vx = 0;
            }
        }
    }
}
    updateAnimation() {
        switch(this.Status){
            case 'idle':
                    this.setSprite(`Player.Idle-${this.animCycle%7}.png`);
                    if(-this.AnimationTimer + performance.now() >375){
                        this.animCycle++;
                        this.AnimationTimer = performance.now();
                    }
                break;
            case 'walking':
                this.setSprite(`Player.Run-${this.animCycle%8}.png`);
                    if(-this.AnimationTimer + performance.now() >50){
                        this.animCycle++;
                        this.AnimationTimer = performance.now();
                    };
                break;
            case 'shoot':
                this.setSprite(`Player.Shoot-${this.animCycle%4}.png`);
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

                break;
            
        }
    }
    
    onCollision(other) {
        if (!this.isActive || this.isDestroyed) return;
        
        switch (other.type) {
            case 'enemy':
                this.takeDamage(1);
                break;
                
            case 'bonus':
                this.collectBonus(other);
                break;
                
            case 'projectile':
                if (other.owner === 'enemy') {
                    this.takeDamage(1);
                    other.destroy();
                }
                break;
        }
    }
    
    takeDamage(amount) {
        if (this.invincible) return;
        
        this.lives -= amount;
        
        if (this.lives <= 0) {
            this.onDeath();
            return;
        }
        
        this.invincible = true;
        this.invincibleTimer = GameConstants.INVINCIBILITY_TIME;
        
        if (soundManager) {
            soundManager.play('hit');
        }
        gameManager.loseLife();
    }
    
    collectBonus(bonus) {
        if (!bonus.isActive) return;
        switch (bonus.bonusType) {
            case GameConstants.BONUS_TYPES.EXIT:
                gameManager.nextLevel();
                super.onDeath();
                break;
                
            case GameConstants.BONUS_TYPES.SCORE:
                this.score += GameConstants.BONUS_SCORE;
                gameManager.addScore(GameConstants.BONUS_SCORE);
                break;
        }
        bonus.playCollectionAnimation();
        bonus.destroy();
        if (soundManager) {
            soundManager.play('bonus');
        }
        
    }
    
    onDeath() {
        if (soundManager) {
            soundManager.play('explosion');
        }
            super.onDeath();
            
            if (gameManager) {
                gameManager.gameOver();
            }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
} else {
    window.Player = Player;
}