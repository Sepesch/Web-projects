// tetris.js
class Tetris {
    constructor() {
        this.COLS = 10;
        this.ROWS = 20;
        this.BLOCK_SIZE = 37;
        
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        
        this.board = Array(this.ROWS).fill().map(() => Array(this.COLS).fill(0));
        this.currentPiece = null;
        this.currentPosition = { x: 0, y: 0 };
        this.score = 0;
        this.level = 1;
        this.linesClearedTotal = 0;
        this.gameInterval = null;
        this.isPaused = false;
        
        this.colors = [
            '#000000', // Пустота
            '#00FFFF', // I - голубой
            '#FFFF00', // O - желтый
            '#800080', // T - фиолетовый
            '#00FF00', // S - зеленый
            '#FF0000', // Z - красный
            '#FFA500', // L - оранжевый
            '#0000FF'  // J - синий
        ];
        
        this.tetrominos = {
            I: { shape: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]], color: 1 },
            O: { shape: [[1,1], [1,1]], color: 3 },
            T: { shape: [[0,1,0], [1,1,1], [0,0,0]], color: 3 },
            S: { shape: [[0,1,1], [1,1,0], [0,0,0]], color: 4 },
            Z: { shape: [[1,1,0], [0,1,1], [0,0,0]], color: 5 },
            L: { shape: [[0,0,1], [1,1,1], [0,0,0]], color: 6 },
            J: { shape: [[1,0,0], [1,1,1], [0,0,0]], color: 7 }
        };
        
        this.init();
    }
    
    init() {
        this.displayUsername();
        this.createNewPiece();
        this.drawBoard();
        this.startGameLoop();
        this.setupEventListeners();
    }
    
    displayUsername() {
        const username = localStorage.getItem("tetris.username") || "Гость";
        if (document.getElementById('username-display')) {
            document.getElementById('username-display').textContent = username;
        }
    }
    
    startGameLoop() {
        if (this.gameInterval) clearInterval(this.gameInterval);
        const speed = Math.max(100, 1000 - (this.level - 1) * 100);
        this.gameInterval = setInterval(() => this.gameLoop(), speed);
    }
    
    gameLoop() {
        if (!this.isPaused) {
            this.moveDown();
            this.drawBoard();
        }
    }
    
    createNewPiece() {
        const pieces = Object.keys(this.tetrominos);
        const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
        this.currentPiece = { ...this.tetrominos[randomPiece] };
        this.currentPosition = {
            x: Math.floor(this.COLS / 2) - Math.floor(this.currentPiece.shape[0].length / 2),
            y: 0
        };
        
        if (this.collision(0, 0)) {
            this.gameOver();
        }
    }
    
    drawBoard() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.COLS * this.BLOCK_SIZE, this.ROWS * this.BLOCK_SIZE);
        
        for (let y = 0; y < this.ROWS; y++) {
            for (let x = 0; x < this.COLS; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x]);
                }
            }
        }
        
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.drawBlock(
                            this.currentPosition.x + x, 
                            this.currentPosition.y + y, 
                            this.currentPiece.color
                        );
                    }
                }
            }
        }
        
        if (this.isPaused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ПАУЗА', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    drawBlock(x, y, colorIndex) {
        this.ctx.fillStyle = this.colors[colorIndex];
        this.ctx.fillRect(x * this.BLOCK_SIZE, y * this.BLOCK_SIZE, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x * this.BLOCK_SIZE, y * this.BLOCK_SIZE, this.BLOCK_SIZE, this.BLOCK_SIZE);
        
    }
    
    moveDown() {
        if (!this.collision(0, 1)) {
            this.currentPosition.y++;
        } else {
            this.lockPiece();
            this.clearLines();
            this.createNewPiece();
        }
    }
    
    collision(offsetX, offsetY) {
        if (!this.currentPiece) return false;
        
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const newX = this.currentPosition.x + x + offsetX;
                    const newY = this.currentPosition.y + y + offsetY;
                    
                    if (newX < 0 || newX >= this.COLS || newY >= this.ROWS) {
                        return true;
                    }
                    
                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    lockPiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPosition.y + y;
                    const boardX = this.currentPosition.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.COLS).fill(0));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            this.linesClearedTotal += linesCleared;
            
            const linePoints = [0, 100, 300, 500, 800];
            this.score += linePoints[linesCleared] * this.level;
            
            this.level = Math.floor(this.linesClearedTotal / 10) + 1;
            
            this.updateDisplay();
            this.startGameLoop();
        }
    }
    
    updateDisplay() {
        if (document.getElementById('score')) {
            document.getElementById('score').textContent = this.score;
        }
        if (document.getElementById('level')) {
            document.getElementById('level').textContent = this.level;
        }
        if (document.getElementById('lines')) {
            document.getElementById('lines').textContent = this.linesClearedTotal;
        }
    }
    
    moveLeft() {
        if (!this.collision(-1, 0)) {
            this.currentPosition.x--;
            this.drawBoard();
        }
    }
    
    moveRight() {
        if (!this.collision(1, 0)) {
            this.currentPosition.x++;
            this.drawBoard();
        }
    }
    
    rotatePiece() {
        if (!this.currentPiece) return;
        
        const originalShape = this.currentPiece.shape;
        const rows = originalShape.length;
        const cols = originalShape[0].length;
        
        const rotated = [];
        for (let i = 0; i < cols; i++) {
            rotated[i] = [];
            for (let j = 0; j < rows; j++) {
                rotated[i][j] = originalShape[rows - 1 - j][i];
            }
        }
        
        const originalPiece = { ...this.currentPiece };
        this.currentPiece.shape = rotated;
        
        if (this.collision(0, 0)) {
            this.currentPiece = originalPiece;
        }
        
        this.drawBoard();
    }
    
    hardDrop() {
        if (!this.currentPiece) return;
        
        while (!this.collision(0, 1)) {
            this.currentPosition.y++;
            this.score += 2;
        }
        this.moveDown();
        this.updateDisplay();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        this.drawBoard();
    }
    
    setupEventListeners() {
        
        document.addEventListener('keydown', (event) => {
            if (!this.currentPiece) return;
            
            switch(event.key) {
                case 'ArrowLeft':
                    this.moveLeft();
                    break;
                case 'ArrowRight':
                    this.moveRight();
                    break;
                case 'ArrowDown':
                    this.moveDown();
                    this.drawBoard();
                    break;
                case 'ArrowUp':
                    this.rotatePiece();
                    break;
                case ' ':
                    this.hardDrop();
                    this.drawBoard();
                    break;
                case 'p':
                case 'P':
                    this.togglePause();
                    break;
                case 'Escape':
                    this.togglePause();
                    break;
            }
        });
    }
    
    gameOver() {
        clearInterval(this.gameInterval);
        this.saveScore();
        
        if (confirm(`Игра окончена!\nВаш счет: ${this.score}\nУровень: ${this.level}\nЛинии: ${this.linesClearedTotal}\n\nХотите сыграть еще раз?`)) {
            this.resetGame();
        } else {
            this.goToRecords();
        }
    }
    
saveScore() {
    const username = localStorage.getItem("tetris.username") || "Гость";
    const records = JSON.parse(localStorage.getItem("tetris.records") || "[]");
    
    const existingUserRecord = records.find(record => record.username === username);
    
    if (existingUserRecord) {
        if (this.score > existingUserRecord.score) {
            existingUserRecord.score = this.score;
            existingUserRecord.level = this.level;
            existingUserRecord.lines = this.linesClearedTotal;
            existingUserRecord.date = new Date().toLocaleDateString('ru-RU');
        }
    } else {
        records.push({
            username: username,
            score: this.score,
            level: this.level,
            lines: this.linesClearedTotal,
            date: new Date().toLocaleDateString('ru-RU')
        });
    }
    
    records.sort((a, b) => b.score - a.score);
    const topRecords = records.slice(0, 10);
    
    localStorage.setItem("tetris.records", JSON.stringify(topRecords));
}
    
    resetGame() {
        this.board = Array(this.ROWS).fill().map(() => Array(this.COLS).fill(0));
        this.score = 0;
        this.level = 1;
        this.linesClearedTotal = 0;
        this.isPaused = false;
        this.updateDisplay();
        this.createNewPiece();
        this.startGameLoop();
    }
    
    goToRecords() {
        window.location = "records.html";
    }
    
    goToLogin() {
        window.location = "index.html";
    }
    
}

document.addEventListener('DOMContentLoaded', function() {
    window.tetrisGame = new Tetris();
});