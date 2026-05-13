"use strict";

class main {
    constructor() {
        this.game = null;
        this.isInitialized = false;
    }
    
    async init() {
        console.log("Инициализация запуска игры...");
        
        
        this.game = new Game();
        
        await this.game.init();
        
        this.setupUIHandlers();
        
        this.isInitialized = true;
        console.log("Игра готова к запуску");
    }
    
    
    setupUIHandlers() {
        document.getElementById('startBtn').addEventListener('click', () => this.game.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.game.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.game.reset());
        
        document.addEventListener('keydown', (e) => {
            if (e.keyCode === GameConstants.KEY_CODES.ESC) {
                this.game.togglePause();
            }
        });
    }
    static loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
    static async loadJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading JSON:', error);
            throw error;
        }
    }
    getGame() {
        return this.game;
    }
}

const gameLauncher = new main();

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM загружен, инициализация игры...");
    gameLauncher.init().catch(error => {
        console.error("Ошибка инициализации игры:", error);
        alert(`Ошибка запуска игры: ${error.message}`);
    });
});

window.GameLauncher = gameLauncher;