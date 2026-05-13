"use strict";

class EventManager {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        this.bindings = {};
        this.initBindings();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    initBindings() {
        this.bindings = {
            [GameConstants.KEY_CODES.LEFT]: 'left',
            [GameConstants.KEY_CODES.RIGHT]: 'right',
            [GameConstants.KEY_CODES.UP]: 'up',
            [GameConstants.KEY_CODES.DOWN]: 'down',
            [GameConstants.KEY_CODES.SPACE]: 'jump',
            [GameConstants.KEY_CODES.ENTER]: 'shoot',
            [GameConstants.KEY_CODES.ESC]: 'pause'
        };
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        document.addEventListener('keydown', (e) => {
            if ([
                GameConstants.KEY_CODES.LEFT,
                GameConstants.KEY_CODES.RIGHT,
                GameConstants.KEY_CODES.UP,
                GameConstants.KEY_CODES.DOWN,
                GameConstants.KEY_CODES.SPACE
            ].includes(e.keyCode)) {
                e.preventDefault();
            }
        });
    }
    
    onKeyDown(event) {
        const action = this.bindings[event.keyCode];
        if (action) {
            this.keys[action] = true;
            event.preventDefault();
        }
    }
    
    onKeyUp(event) {
        const action = this.bindings[event.keyCode];
        if (action) {
            this.keys[action] = false;
            event.preventDefault();
        }
    }
    
    onMouseDown(event) {
        this.mouse.down = true;
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
    }
    
    onMouseUp(event) {
        this.mouse.down = false;
    }
    
    onMouseMove(event) {
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
    }
    
    isKeyPressed(key) {
        return !!this.keys[key];
    }
    
    getMousePosition() {
        return { ...this.mouse };
    }
    
    clear() {
        this.keys = {};
        this.mouse.down = false;
    }
    
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventManager;
} else {
    window.EventManager = EventManager;
}