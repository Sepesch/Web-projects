"use strict";

class Game {
    constructor() {
        this.eventManager = null;
        this.soundManager = null;
        this.spriteManager = null;
        this.mapManager = null;
        this.renderer = null;
        
        this.currentLevel = 1;
        this.maxLevels = 2;
        this.entities = [];
        this.player = null;
        this.exitSummonned = false;

        this.isRunning = false;
        this.isPaused = false;
        this.isInitialized = false;
        
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameTime = 0;
        
        this.lastUpdateTime = 0;
        this.gameLoopId = null;
        
        this.screens = {};
        this.finalScore = 0;
        
        // Звуковые эффекты
        this.backgroundMusic = null;
        this.isSoundEnabled = true;
        
        this.levelConfigs = {
            1: {
                playerStart: { x: 10, y: 520 },
                enemies: [
                    { x: 704, y: 532 },
                    { x: 720, y: 532 },
                    { x: 736, y: 532 },
                    { x: 320, y: 224 },
                    { x: 900, y: 224 }
                ],
                bonuses: [
                    { x: 320, y: 576 },
                    { x: 480, y: 576 },
                    { x: 576, y: 576 },
                    { x: 672, y: 576 },
                    { x: 766, y: 576 },
                    { x: 1154, y: 544 },
                    { x: 1218, y: 480 },
                    { x: 1154, y: 416 },
                    { x: 1024, y: 384 },
                    { x: 960, y: 320 },
                    { x: 644, y: 288 },
                    { x: 548, y: 224 },
                    { x: 452, y: 288 }
                ],
                exit: [
                    { x: 0, y: 160 },
                    { x: 0, y: 192 }
                ]
            },
            2: {
                playerStart: { x: 1420, y: 200 },
                enemies: [
                    { x: 832, y: 224 },
                    { x: 480, y: 256 },
                    { x: 224, y: 160 },
                    { x: 832, y: 32 },
                    { x: 800, y: 416 },
                    { x: 480, y: 416 },
                    { x: 256, y: 608 }
                ],
                bonuses: [
                    { x: 1056, y: 224 },
                    { x: 896, y: 256 },
                    { x: 832, y: 256 },
                    { x: 768, y: 256 },
                    { x: 544, y: 288 },
                    { x: 480, y: 288 },
                    { x: 416, y: 288 },
                    { x: 288, y: 192 },
                    { x: 224, y: 192 },
                    { x: 158, y: 192 },
                    { x: 480, y: 128 },
                    { x: 576, y: 96 },
                    { x: 832, y: 64 },
                    { x: 480, y: 576 },
                    { x: 576, y: 576 },
                    { x: 672, y: 576 }
                ],
                exit: [
                    { x: 0, y: 672 },
                    { x: 0, y: 704 }
                ]
            }
        };
        
    }
    
    async init() {
        console.log("Инициализация игры...");
        
        this.initRenderer();
        
        await this.initManagers();
        this.createScreens();
        await this.loadLevel(this.currentLevel);
        
        this.isInitialized = true;
        console.log("Игра инициализирована");
        
        this.showScreen('start');
        
        this.setupSoundStart();
    }
    
    setupSoundStart() {
        const startHandler = () => {
            if (this.soundManager) {
                this.soundManager.resumeIfSuspended().then(() => {
                    console.log("AudioContext разблокирован");
                });
            }
            document.removeEventListener('click', startHandler);
            document.removeEventListener('keydown', startHandler);
        };
        
        document.addEventListener('click', startHandler);
        document.addEventListener('keydown', startHandler);
    }
    
    initRenderer() {
        this.renderer = new CanvasRenderer();
        this.renderer.init();
        window.renderer = this.renderer;
    }
    
    async start() {
        if (!this.isInitialized) return;
        
        const startBtn = document.getElementById('startBtn');
        const btnText = startBtn.textContent;
        
        if (btnText === "Новая игра") {
            this.reset();
            startBtn.textContent = "Старт";
            return;
        }
        
        if (this.soundManager && this.isSoundEnabled) {
            await this.soundManager.resumeIfSuspended();
            this.playBackgroundMusic();
        }
        
        this.hideAllScreens();
        this.startGameLoop();
        this.isRunning = true;
        this.isPaused = false;
        
        console.log("Игра началась");
    }
    
    playBackgroundMusic() {
        if (this.soundManager && this.isSoundEnabled && !this.soundManager.isSoundPlaying('background')) {
            this.backgroundMusic = this.soundManager.play('background', {
                volume: 0.3,
                loop: true,
                fadeIn: 1.0
            });
            console.log("Фоновая музыка запущена");
        }
    }
    
    togglePause() {
        if (!this.isRunning) return;
        
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            cancelAnimationFrame(this.gameLoopId);
            this.showScreen('pause');
            
            if (this.backgroundMusic && this.backgroundMusic.gainNode) {
                this.backgroundMusic.gainNode.gain.value = 0;
            }
            
            console.log("Игра на паузе");
        } else {
            this.lastUpdateTime = performance.now();
            this.gameLoopId = requestAnimationFrame((time) => this.gameLoop(time));
            this.hideAllScreens();
            
            if (this.backgroundMusic && this.backgroundMusic.gainNode) {
                this.backgroundMusic.gainNode.gain.value = 0.3;
            }
            
            console.log("Игра продолжена");
        }
    }
    
    reset() {
        this.stopGameLoop();
        this.clearEntities();
        this.score = 0;
        this.finalScore = 0;
        this.lives = 3;
        this.currentLevel = 1;
        this.gameTime = 0;
        this.exitSummonned = false;
        
        if (this.soundManager) {
            this.soundManager.stopAll();
        }
        
        this.loadLevel(this.currentLevel);
        this.showScreen('start');
        this.updateUI();
        this.updateButtons();
        
        console.log("Игра сброшена");
    }
    
    nextLevel() {
        if(this.currentLevel == 2){
            this.showScreen('gameComplete');
            const startBtn = document.getElementById('startBtn');
            startBtn.textContent = "Новая игра";
            startBtn.disabled = false;
            this.isPaused = true;
            
            if (this.soundManager && this.isSoundEnabled) {
                this.soundManager.play('victory', { volume: 0.6 });
                if (this.backgroundMusic) {
                    this.soundManager.stop(this.backgroundMusic);
                }
            }
        }
        
        if (this.currentLevel < this.maxLevels) {
            this.currentLevel++;
            
            if (this.soundManager && this.isSoundEnabled) {
                this.soundManager.play('levelComplete', { volume: 0.5 });
            }
            
            this.clearEntities();
            this.loadLevel(this.currentLevel);
            this.updateUI();
            this.score = 0;
            this.exitSummonned = false;
            
            console.log(`Переход на уровень ${this.currentLevel}`);
        }
    }
    
    clearEntities() {
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            entity.destroy();
        }
        this.entities = [];
        this.player = null;
    }
    
    startGameLoop() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.gameTime = 0;
        this.lastUpdateTime = performance.now();
        
        this.gameLoopId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    stopGameLoop() {
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        if (this.backgroundMusic) {
            this.soundManager.stop(this.backgroundMusic);
            this.backgroundMusic = null;
        }
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning || this.isPaused) return;
        
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;
        
        this.gameTime += deltaTime;
        this.update(deltaTime);
        this.render();
        
        this.gameLoopId = requestAnimationFrame((time) => this.gameLoop(time));
        
        if (((this.currentLevel == 1 && this.score == 1600) || (this.currentLevel == 2 && this.score == 2300)) && !this.exitSummonned) {
            this.summonExit();
        }
    }
    
    update(deltaTime) {
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];
            entity.update(deltaTime);
            
            if (entity.isDestroyed) {
                this.removeEntity(entity);
            }
        }
        
        this.checkCollisions();
        
        if (Math.floor(this.gameTime * 10) % 10 === 0) {
            this.updateUI();
        }
    }
    
    render() {
        if (!this.renderer) return;
        
        this.renderer.render({
            mapManager: this.mapManager,
            entities: this.entities,
            player: this.player,
            currentLevel: this.currentLevel,
            lives: this.lives,
            score: this.score,
            isPaused: this.isPaused,
            isRunning: this.isRunning
        });
    }
    explode(bullet){
        this.entities.forEach((entry) =>{
            console.log(entry);
            if(entry.type == 'enemy'){
                if(Math.abs(entry.x - bullet.x)<50){
                    if(Math.abs(entry.y - bullet.y)< 50 || Math.abs(entry.y+64 - bullet.y)<50){
                        entry.takeDamage(1);
                    }
                }
                else{
                    if(Math.abs(entry.x+64 - bullet.x)<50){
                    if(Math.abs(entry.y - bullet.y)< 50 || Math.abs(entry.y+64 - bullet.y)<50){
                        entry.takeDamage(1);
                    }
                    }
                }
            }
        });
    }
    addEntity(entity) {
        this.entities.push(entity);
    }
    
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }
    
    setPlayer(player) {
        this.player = player;
        this.addEntity(player);
    }
    
    checkCollisions() {
        for (let i = 0; i < this.entities.length; i++) {
            const entityA = this.entities[i];
            
            for (let j = i + 1; j < this.entities.length; j++) {
                const entityB = this.entities[j];
                
                if (this.checkEntityCollision(entityA, entityB)) {
                    if (entityA.onCollision) {
                        entityA.onCollision(entityB);
                    }
                    if (entityB.onCollision) {
                        entityB.onCollision(entityA);
                    }
                }
            }
        }
    }
    
    checkEntityCollision(entityA, entityB) {
        if (!entityA || !entityB || entityA === entityB) return false;
        
        return GameUtils.checkCollision(
            { x: entityA.x, y: entityA.y, width: entityA.width, height: entityA.height },
            { x: entityB.x, y: entityB.y, width: entityB.width, height: entityB.height }
        );
    }
    
    addScore(points) {
        this.score += points;
        this.finalScore += points;
        
        if (this.soundManager && this.isSoundEnabled) {
            this.soundManager.play('coin', { volume: 0.4, playbackRate: 1.2 });
        }
        
        this.updateUI();
    }
    
    loseLife() {
        this.lives--;
        
        if (this.soundManager && this.isSoundEnabled) {
            this.soundManager.play('hit', { volume: 0.6 });
        }
        
        if (this.lives <= 0) {
            this.gameOver();
        }
        
        this.updateUI();
    }
    
    gameOver() {
        console.log("Game Over! Финальный счет:", this.finalScore);
        this.stopGameLoop();
        
        this.isRunning = false;
        this.showScreen('gameOver');
        
        if (this.soundManager && this.isSoundEnabled) {
            this.soundManager.play('gameOver', { volume: 0.5 });
        }
        
        const startBtn = document.getElementById('startBtn');
        startBtn.textContent = "Новая игра";
        startBtn.disabled = false;
    }
    
    playWorldSound(name, x, y) {
        if (this.soundManager && this.isSoundEnabled && this.player) {
            return this.soundManager.playWorldSound(
                name, 
                x, 
                y, 
                this.player.x, 
                this.player.y
            );
        }
        return null;
    }
    
    async initManagers() {
        this.eventManager = new EventManager();
        this.soundManager = new SoundManager();
        this.spriteManager = new SpriteManager();
        this.mapManager = new MapManager();
        
        window.eventManager = this.eventManager;
        window.soundManager = this.soundManager;
        window.spriteManager = this.spriteManager;
        window.mapManager = this.mapManager;
        window.gameManager = this;
        
        this.eventManager.init();
        await this.soundManager.init();
        
        await this.soundManager.preloadCommonSounds();
        
        await this.spriteManager.init();
        await this.mapManager.init();
    }
    
    createScreens() {
        const gameWindow = document.querySelector('.game-window');
        if (!gameWindow) {
            console.error('Не найден .game-window');
            return;
        }
        
        this.screens = {
            loading: this.createScreen('loading-screen', 'Загрузка...'),
            start: this.createScreen('start-screen', '2D СТРЕЛЯЛКА'),
            pause: this.createScreen('pause-screen', 'ПАУЗА'),
            levelComplete: this.createScreen('level-complete-screen', 'УРОВЕНЬ ПРОЙДЕН!'),
            gameComplete: this.createScreen('game-complete', 'ПОБЕДА!'),
            gameOver: this.createScreen('game-over-screen', 'GAME OVER')
        };
        
        this.screens.loading.innerHTML += `
            <div class="loading-bar">
                <div class="loading-progress"></div>
            </div>
            <div class="loading-message">Загрузка...</div>
        `;
        
        this.screens.start.innerHTML += `
            <div class="screen-message">НАЖМИТЕ СТАРТ ДЛЯ НАЧАЛА ИГРЫ</div>
            <div class="screen-instructions">
                Управление: A D - движение, ПРОБЕЛ - прыжок, CTRL - стрельба<br>
                <span class="level-indicator">Уровень ${this.currentLevel}</span>
            </div>
        `;
        
        this.screens.pause.innerHTML += `
            <div class="screen-message">Нажмите ПАУЗА для продолжения</div>
        `;
        
        this.screens.gameOver.innerHTML += `
            <div class="screen-message">Финальный счет: <span id="finalScore">${this.score}</span></div>
        `;
        
        this.screens.gameComplete.innerHTML += `
            <div class="screen-message">Игра пройдена!</div>
            <div class="screen-instructions">
                <div style="margin: 15px 0;">
                    <strong>Финальный счет:</strong> <span id="finalScore" style="font-size: 28px; color: #ffd700;">${this.score}</span>
                </div>
                <div style="margin: 15px 0;">
                    <strong>Осталось жизней:</strong> <span id="finalLives" style="font-size: 24px; color: #4CAF50;">${this.lives}</span>
                </div>
            </div>
        `;
        
        Object.values(this.screens).forEach(screen => {
            gameWindow.appendChild(screen);
        });
    }
    
    createScreen(id, title) {
        const screen = document.createElement('div');
        screen.id = id;
        screen.className = 'screen-overlay';
        screen.innerHTML = `<div class="screen-title">${title}</div>`;
        return screen;
    }
    
    showScreen(screenName) {
        this.hideAllScreens();
        
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            
            if (screenName === 'gameOver') {
                const finalScore = this.screens.gameOver.querySelector('#finalScore');
                if (finalScore) {
                    finalScore.textContent = this.finalScore;
                }
            }
            if (screenName === 'gameComplete') {
                const finalScore = this.screens.gameComplete.querySelector('#finalScore');
                if (finalScore) {
                    finalScore.textContent = this.finalScore;
                }
            }
            if (screenName === 'start') {
                const levelIndicator = this.screens.start.querySelector('.level-indicator');
                if (levelIndicator) {
                    levelIndicator.textContent = `Уровень ${this.currentLevel}`;
                }
            }
        }
    }
    
    hideScreen(screenName) {
        if (this.screens[screenName]) {
            this.screens[screenName].classList.remove('active');
        }
    }
    
    hideAllScreens() {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
    }
    
    async loadLevel(level) {
        console.log(`Загрузка уровня ${level}...`);
        this.showScreen('loading');
        
        try {
            await Promise.all([
                this.spriteManager.loadSpriteSheet(
                    'Player',
                    '../../assets/sprites/player/Player.png',
                    '../../assets/sprites/player/Player.json'
                ),
                this.spriteManager.loadSpriteSheet(
                    'Bonus',
                    '../../assets/sprites/items/Coin_A.png',
                    '../../assets/sprites/items/coin.json'
                ),
                this.spriteManager.loadSpriteSheet(
                    'Enemy',
                    '../../assets/sprites/enemy/enemy.png',
                    '../../assets/sprites/enemy/enemy.json'
                ),
                this.spriteManager.loadSpriteSheet(
                    'Bullet',
                    '../../assets/sprites/Explosion.png',
                    '../../assets/sprites/Explosion.json'
                ),
                this.spriteManager.loadSpriteSheet(
                    'Map',
                    `../../assets/sprites/map/tiles.png`,
                    `../../assets/sprites/map/tiles.json`
                ),
                this.mapManager.loadMap(
                    `../../assets/maps/lvl${level}.json`,
                    `../../assets/sprites/map/tiles.json`,
                    `../../assets/sprites/map/tiles.png`
                ),
            ]);
            
            this.createLevelObjects(level);
            
            console.log(`Уровень ${level} загружен`);
            this.hideScreen('loading');
            
        } catch (error) {
            console.error("Ошибка загрузки уровня:", error);
            this.hideScreen('loading');
        }
    }
    
    createLevelObjects(level) {
        this.clearEntities();
        
        const player = new Player(
            this.levelConfigs[level].playerStart.x,
            this.levelConfigs[level].playerStart.y
        );
        this.setPlayer(player);
        
        this.levelConfigs[level].bonuses.forEach(cords => {
            const bonus = new Bonus(cords.x, cords.y, GameConstants.BONUS_TYPES.SCORE);
            bonus.setSprite('Bonus.Coin_A.png');
            
            bonus.onCollect = () => {
                this.addScore(GameConstants.BONUS_POINTS.SCORE);
            };
            
            this.addEntity(bonus);
        });
        
        this.levelConfigs[level].enemies.forEach(cords => {
            const enemy = new Enemy(cords.x, cords.y);
            enemy.setSprite('Enemy.Idle-1.png');
            
            enemy.onShoot = () => {
                this.playWorldSound('shoot', enemy.x, enemy.y);
            };
            
            enemy.onDestroy = () => {
                this.playWorldSound('explosion', enemy.x, enemy.y);
                this.addScore(GameConstants.BONUS_POINTS.ENEMY);
            };
            
            this.addEntity(enemy);
        });
    }
    
    summonExit() {
        this.levelConfigs[this.currentLevel].exit.forEach(cords => {
            const exit = new Bonus(cords.x, cords.y, GameConstants.BONUS_TYPES.EXIT);
            exit.setSprite('Map.49');
            
            exit.onCollect = () => {
                this.nextLevel();
            };
            
            this.addEntity(exit);
            console.log('Exit created');
            this.exitSummonned = true;
            
            if (this.soundManager && this.isSoundEnabled) {
                this.soundManager.play('coin', { volume: 0.6, playbackRate: 0.8 });
            }
        });
    }
    
    updateUI() {
        const levelElement = document.getElementById('level');
        const livesElement = document.getElementById('lives');
        const scoreElement = document.getElementById('score');
        
        if (levelElement) levelElement.textContent = this.currentLevel;
        if (livesElement) livesElement.textContent = this.lives;
        if (scoreElement) scoreElement.textContent = this.score;
        
        this.updateButtons();
        
        const levelIndicator = this.screens.start?.querySelector('.level-indicator');
        if (levelIndicator) {
            levelIndicator.textContent = `Уровень ${this.currentLevel}`;
        }
    }
    
    updateButtons() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (!startBtn || !pauseBtn) return;
        
        if (this.isRunning && !this.isPaused) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            pauseBtn.textContent = "Пауза";
        } else if (this.isPaused) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            pauseBtn.textContent = "Продолжить";
        } else if (this.score > 0) {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            pauseBtn.textContent = "Пауза";
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            pauseBtn.textContent = "Пауза";
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Game;
} else {
    window.Game = Game;
}