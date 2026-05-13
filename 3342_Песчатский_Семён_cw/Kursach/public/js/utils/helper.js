"use strict";

const GameConstants = {    TILE_SIZE: 32,
    ENTITY_SIZE: 64,
    PLAYER_SIZE: 64,
    ENEMY_SIZE: 64,
    PROJECTILE_SIZE: 16,
    BONUS_SIZE: 32,
    
    GRAVITY: 980,
    MAX_FALL_SPEED: 500,
    JUMP_FORCE: 500,
    ENEMY_JUMP_FORCE: 250,
    
    PLAYER_SPEED: 200,
    ENEMY_SPEED: {
        basic: 80,
        fast: 120,
        heavy: 50,
        shooter: 60
    },
    PROJECTILE_SPEED: {
        basic: 300,
        fast: 400,
        rocket: 200,
        laser: 500
    },
    PLATFORM_SPEED: 100,
    
    SHOOT_DELAY: 0.3,
    ENEMY_SHOOT_DELAY: 1.5,
    ENEMY_ATTACK_DELAY: 1.0,
    INVINCIBILITY_TIME: 2.0,
    SPEED_BOOST_TIME: 5.0,
    PROJECTILE_LIFETIME: 5.0,
    
    PLAYER_DAMAGE: 1,
    ENEMY_DAMAGE: {
        basic: 1,
    },
    PROJECTILE_DAMAGE: {
        basic: 1,
    },
    
    PLAYER_MAX_HEALTH: 3,
    MAX_LIVES: 5,
    ENEMY_HEALTH: {
        basic: 1,
        fast: 1,
        heavy: 3,
        shooter: 2
    },
    
    ENEMY_POINTS: {
        basic: 100,
    },
    BONUS_SCORE: 100,
    
    BONUS_TYPES: {
        EXIT: 'exit',
        SCORE: 'score'
    },
    
    KEY_CODES: {
        LEFT: 65,
        UP: 87,
        RIGHT: 68,
        DOWN: 83,
        SPACE: 32,
        CTRL: 17,
        SHIFT: 16,
        ESC: 27,
        ENTER: 13,
        W: 87,
        A: 65,
        S: 83,
        D: 68
    },
    
};

const GameUtils = {
    random: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    checkCollision: function(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    },
    
    normalizeVector: function(x, y) {
        const length = Math.sqrt(x * x + y * y);
        if (length === 0) return { x: 0, y: 0 };
        return { x: x / length, y: y / length };
    },
    
    distance: function(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },
    
    clamp: function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    formatTime: function(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameConstants, GameUtils };
} else {
    window.GameConstants = GameConstants;
    window.GameUtils = GameUtils;
}