"use strict";

class SoundManager {
    constructor() {
        this.sounds = new Map();
        this.activeSounds = new Set();
        this.muted = false;
        this.volume = 0.5;
        this.context = null;
        
        this.initContext();
    }
    
    initContext() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            console.log("AudioContext инициализирован");
        } catch (error) {
            console.warn("Web Audio API не поддерживается:", error);
        }
    }
    
    async init() {
        console.log("SoundManager инициализация...");
        return Promise.resolve();
    }
    
    async resumeIfSuspended() {
        if (this.context && this.context.state === 'suspended') {
            try {
                await this.context.resume();
                console.log("AudioContext возобновлён");
                return true;
            } catch (error) {
                console.error("Ошибка возобновления AudioContext:", error);
                return false;
            }
        }
        return false;
    }
    
    async loadSound(name, url) {
        if (!this.context) {
            console.warn("AudioContext не доступен, звук не загружен:", name);
            return null;
        }
        
        try {
            console.log(`Загрузка звука: ${name} из ${url}`);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            
            this.sounds.set(name, audioBuffer);
            console.log("Звук загружен:", name);
            return audioBuffer;
        } catch (error) {
            console.error("Ошибка загрузки звука:", name, error);
            return null;
        }
    }
    
    async loadSounds(soundList) {
        if (!soundList || !Array.isArray(soundList)) {
            console.warn("Некорректный список звуков:", soundList);
            return;
        }
        
        const promises = soundList.map(sound => {
            if (typeof sound === 'string') {
                const name = sound.split('/').pop().split('.')[0];
                return this.loadSound(name, sound);
            } else if (sound.name && sound.url) {
                return this.loadSound(sound.name, sound.url);
            }
            return Promise.resolve();
        });
        
        await Promise.all(promises);
        console.log("Все звуки загружены. Загружено:", this.sounds.size);
    }
    
    play(name, options = {}) {
        if (this.muted || !this.context || !this.sounds.has(name)) {
            return null;
        }
        
        const {
            volume = this.volume,
            loop = false,
            playbackRate = 1.0,
            fadeIn = 0
        } = options;
        
        try {
            const source = this.context.createBufferSource();
            const gainNode = this.context.createGain();
            
            source.buffer = this.sounds.get(name);
            source.loop = loop;
            source.playbackRate.value = playbackRate;
            
            if (fadeIn > 0) {
                gainNode.gain.setValueAtTime(0, this.context.currentTime);
                gainNode.gain.linearRampToValueAtTime(volume, this.context.currentTime + fadeIn);
            } else {
                gainNode.gain.value = volume;
            }
            
            source.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            source.start(0);
            
            const soundObj = { 
                source, 
                gainNode, 
                name,
                startTime: this.context.currentTime,
                loop 
            };
            
            this.activeSounds.add(soundObj);
            
            source.onended = () => {
                this.activeSounds.delete(soundObj);
                source.disconnect();
                gainNode.disconnect();
            };
            
            return soundObj;
        } catch (error) {
            console.error("Ошибка воспроизведения звука:", name, error);
            return null;
        }
    }
    
    playWorldSound(name, x, y, playerX, playerY, maxDistance = 800) {
        if (!this.context || !this.sounds.has(name)) {
            return null;
        }
        
        const dx = x - playerX;
        const dy = y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > maxDistance) {
            return null;
        }
        
        let volume = 1 - (distance / maxDistance);
        volume = Math.max(0.1, Math.min(1, volume));
        
        const pan = Math.max(-1, Math.min(1, dx / maxDistance));
        
        return this.play(name, { 
            volume: volume * this.volume,
            playbackRate: 1.0 + (pan * 0.1) // Легкое изменение высоты тона для стереоэффекта
        });
    }
    
    stop(sound) {
        if (sound && sound.source && this.activeSounds.has(sound)) {
            try {
                sound.source.stop();
                this.activeSounds.delete(sound);
                sound.source.disconnect();
                if (sound.gainNode) {
                    sound.gainNode.disconnect();
                }
            } catch (error) {
                console.error("Ошибка остановки звука:", error);
            }
        }
    }
    
    stopAll() {
        this.activeSounds.forEach(sound => {
            try {
                sound.source.stop();
            } catch (error) {
                // Игнорируем ошибки остановки уже завершенных звуков
            }
        });
        this.activeSounds.clear();
    }
    
    setVolume(volume) {
        const newVolume = Math.max(0, Math.min(1, volume));
        this.volume = newVolume;
        
        this.activeSounds.forEach(sound => {
            if (sound.gainNode) {
                sound.gainNode.gain.value = newVolume;
            }
        });
    }
    
    isSoundPlaying(name) {
        for (const sound of this.activeSounds) {
            if (sound.name === name) {
                return true;
            }
        }
        return false;
    }
    
    getSoundNames() {
        return Array.from(this.sounds.keys());
    }
    
    preloadCommonSounds() {
        return this.loadSounds([
            { name: 'jump', url: '../../assets/sounds/jump.wav' },
            { name: 'shoot', url: '../../assets/sounds/shoot.wav' },
            // { name: 'explosion', url: '../../assets/sounds/explosion.wav' },
            { name: 'coin', url: '../../assets/sounds/coin.wav' },
            { name: 'hit', url: '../../assets/sounds/hit.wav' },
            { name: 'gameOver', url: '../../assets/sounds/gameOver.wav' },
            { name: 'levelComplete', url: '../../assets/sounds/levelComplete.wav' },
            { name: 'victory', url: '../../assets/sounds/victory.wav' },
            // { name: 'background', url: '../../assets/sounds/background.mp3' }
        ]);
    }
}

const Helper = {
    clamp: (value, min, max) => Math.min(Math.max(value, min), max)
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoundManager;
} else {
    window.SoundManager = SoundManager;
    window.Helper = Helper;
}