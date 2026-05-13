"use strict";

class Bonus extends Entity {
    constructor(x, y, bonusType) {
        super(x, y, GameConstants.BONUS_SIZE, GameConstants.BONUS_SIZE);
        
        this.type = 'bonus';
        this.bonusType = bonusType;
        this.floatHeight = 0;
        this.floatSpeed = 2;
        this.floatDirection = 1;
        this.rotation = 0;
        
        this.collectable = true;
        this.collectRadius = 20;
        
        this.pulseScale = 1;
        this.pulseDirection = 1;
        
        // Устанавливаем спрайт в зависимости от типа бонуса
        if (bonusType === GameConstants.BONUS_TYPES.SCORE) {
            this.setSprite('Bonus.Coin_A.png');
        } else if (bonusType === GameConstants.BONUS_TYPES.EXIT) {
            this.setSprite('Map.49');
        }
        
        // Убираем DOM инициализацию
        // this.element.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Анимация плавания
        this.floatHeight += this.floatSpeed * this.floatDirection * deltaTime;
        if (this.floatHeight > 5 || this.floatHeight < -5) {
            this.floatDirection *= -1;
        }
        
        // Анимация пульсации
        this.pulseScale += 0.5 * this.pulseDirection * deltaTime;
        if (this.pulseScale > 1.2 || this.pulseScale < 0.8) {
            this.pulseDirection *= -1;
        }
        
        // Вращение
        this.rotation += 90 * deltaTime; // 90 градусов в секунду
        
        // Проверка сбора игроком
        this.checkPlayerCollection();
    }
    
    checkPlayerCollection() {
        if (!this.collectable || !gameManager || !gameManager.player) return;
        
        const player = gameManager.player;
        
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const bonusCenterX = this.x + this.width / 2;
        const bonusCenterY = this.y + this.height / 2;
        
        const dx = playerCenterX - bonusCenterX;
        const dy = playerCenterY - bonusCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Притяжение бонуса к игроку при приближении
        if (distance < this.collectRadius * 2) {
            const attractionForce = 0.1;
            this.x += dx * attractionForce;
            this.y += dy * attractionForce;
        }
        
        // Сбор при касании
        if (distance < this.collectRadius) {
            this.collect(player);
        }
    }
    
    collect(collector) {
        if (!this.collectable || !collector.onCollision) return;
        
        this.collectable = false;
        
        collector.onCollision(this);
        
        this.playCollectionAnimation();
        
        // Уничтожаем через 0.5 секунд для анимации
        setTimeout(() => {
            this.destroy();
        }, 500);
    }
    
    playCollectionAnimation() {
        // Эффект сбора будет отрисован в CanvasRenderer
        this.collectionAnimationTime = 0.5; // 500ms анимация
        
        // Звук сбора
        if (soundManager) {
            soundManager.play('bonus');
        }
    }
    
    onCollision(other) {
        if (other.type === 'player' && this.collectable) {
            this.collect(other);
        }
        return GameConstants.BONUS_SCORE;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Bonus;
} else {
    window.Bonus = Bonus;
}