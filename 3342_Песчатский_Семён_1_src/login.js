// login.js
class LoginManager {
    constructor() {
        this.usernameInput = document.getElementById('username');
        this.loginForm = document.querySelector('form');
        
        this.init();
    }
    
    init() {
        this.loadSavedUsername();
        this.setupEventListeners();
    }
    
    loadSavedUsername() {
        const savedUsername = localStorage.getItem("tetris.username") || "Гость";
        if (savedUsername && savedUsername !== "Гость") {
            this.usernameInput.value = savedUsername;
        }
    }
    
    setupEventListeners() {
        this.loginForm.addEventListener('submit', (event) => {
            this.handleLogin(event);
        });
        
        this.usernameInput.addEventListener('change', () => {
            this.saveUsername();
        });
        
        this.usernameInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.handleLogin(event);
            }
        });
        
        // Автофокус на поле ввода
        this.usernameInput.focus();
    }
    
    saveUsername() {
        const username = this.usernameInput.value.trim();
        if (username) {
            if (username && username.trim() !== '') {
            localStorage.setItem("tetris.username", username.trim());
            return true;
        }
        return false;
        }
    }
    
    handleLogin(event) {
        event.preventDefault();
        
        const username = this.usernameInput.value.trim();
        
        if (!username) {
            alert('Пожалуйста, введите ваше имя');
            this.usernameInput.focus();
            return;
        }
        
        if (username.length < 2) {
            alert('Имя должно содержать минимум 2 символа');
            this.usernameInput.focus();
            return;
        }
        
        if (username.length > 20) {
            alert('Имя слишком длинное (максимум 20 символов)');
            this.usernameInput.focus();
            return;
        }
        
        // Сохраняем имя и переходим к игре
        if (StorageManager.saveUsername(username)) {
            window.location = "game.html";
        }
    }
    
    static goToGameAsGuest() {
        StorageManager.saveUsername("Гость");
        window.location = "game.html";
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    window.loginManager = new LoginManager();
});