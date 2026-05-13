console.log('=== NEWS.JS LOADED ===');

class NewsManager {
    constructor() {
        this.apiBase = '/api';
        this.users = [];
        this.currentNews = [];
        this.init();
    }

    async init() {
        console.log('NewsManager initialized');
        await this.loadUsers();
        this.setupEventListeners();
    }

    async loadUsers() {
        try {
            console.log('Loading users for selection...');
            const response = await fetch(`${this.apiBase}/users`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.users = await response.json();
            this.renderUserSelect(this.users);
            console.log(`Loaded ${this.users.length} users`);
            
        } catch (error) {
            console.error('Error loading users:', error);
            this.showError('Ошибка загрузки пользователей: ' + error.message);
        }
    }

    renderUserSelect(users) {
        const select = document.getElementById('user-select');
        if (!select) {
            console.error('User select element not found');
            return;
        }

        select.innerHTML = '<option value="">-- Выберите пользователя --</option>' +
            users.map(user => 
                `<option value="${user.id}">${user.fullName} (${user.email})</option>`
            ).join('');
    }

    async loadNews(userId) {
        const container = document.getElementById('news-container');
        
        try {
            container.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Загрузка...</span>
                    </div>
                    <p class="mt-2 text-muted">Загрузка новостей...</p>
                </div>
            `;

            console.log(`Loading news for user ${userId}...`);
            const response = await fetch(`${this.apiBase}/news/${userId}/feed`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.currentNews = await response.json();
            console.log(`Loaded ${this.currentNews.length} news items`);
            
            this.applyFilter();
            
        } catch (error) {
            console.error('Error loading news:', error);
            container.innerHTML = `
                <div class="alert alert-danger">
                    <h5><i class="bi bi-exclamation-triangle"></i> Ошибка загрузки</h5>
                    <p>${error.message}</p>
                    <button class="btn btn-warning mt-2" onclick="newsManager.loadNews(${userId})">
                        <i class="bi bi-arrow-clockwise"></i> Попробовать снова
                    </button>
                </div>
            `;
        }
    }

    // Применение фильтра к новостям
    applyFilter() {
        const filter = document.getElementById('news-filter').value;
        let filteredNews = this.currentNews;

        if (filter === 'active') {
            filteredNews = this.currentNews.filter(news => !news.isBlocked);
        } else if (filter === 'blocked') {
            filteredNews = this.currentNews.filter(news => news.isBlocked);
        }

        this.renderNews(filteredNews);
        this.updateStatistics(filteredNews);
    }

    // Отображение новостей
    renderNews(newsItems) {
        const container = document.getElementById('news-container');
        
        if (!newsItems || newsItems.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-newspaper display-1 text-muted"></i>
                    <p class="mt-3 text-muted">Нет новостей для отображения</p>
                </div>
            `;
            return;
        }

        container.innerHTML = newsItems.map(news => `
            <div class="card mb-4 news-card ${news.isBlocked ? 'blocked' : 'active'}">
                <div class="card-header bg-light d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <img src="${news.senderPhoto || this.generateAvatar(news.senderName)}" 
                             alt="${news.senderName}" 
                             class="rounded-circle me-3" 
                             width="40" 
                             height="40"
                             style="object-fit: cover;"
                             onerror="this.src='https://via.placeholder.com/40/6c757d/ffffff?text=?'">
                        <div>
                            <h6 class="card-title mb-0">${news.senderName}</h6>
                            <small class="text-muted">${this.formatDate(news.timestamp)}</small>
                        </div>
                    </div>
                    <div>
                        ${news.isBlocked ? 
                            '<span class="badge bg-danger me-2"><i class="bi bi-slash-circle"></i> Заблокировано</span>' : 
                            '<span class="badge bg-success me-2"><i class="bi bi-check-circle"></i> Активно</span>'
                        }
                    </div>
                </div>
                <div class="card-body">
                    <p class="card-text news-content">${this.escapeHtml(news.content)}</p>
                    
                    ${news.isPublic ? 
                        '<span class="badge bg-info"><i class="bi bi-globe"></i> Публичная</span>' : 
                        '<span class="badge bg-secondary"><i class="bi bi-lock"></i> Приватная</span>'
                    }
                </div>
                <div class="card-footer bg-transparent">
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">
                            <i class="bi bi-clock me-1"></i>
                            ${this.formatTimeAgo(news.timestamp)}
                        </small>
                        <div class="btn-group">
                            ${!news.isBlocked ? 
                                `<button class="btn btn-warning btn-sm" onclick="newsManager.openBlockModal(${news.id}, '${this.escapeHtml(news.content)}')">
                                    <i class="bi bi-slash-circle"></i> Заблокировать
                                </button>` :
                                `<button class="btn btn-success btn-sm" onclick="newsManager.unblockNews(${news.id})">
                                    <i class="bi bi-check-circle"></i> Разблокировать
                                </button>`
                            }
                            <button class="btn btn-outline-primary btn-sm" onclick="newsManager.viewDetails(${news.id})">
                                <i class="bi bi-eye"></i> Подробности
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Обновляем статистику
        this.updateStatistics(newsItems);
    }

    // Открытие модального окна блокировки
    openBlockModal(newsId, newsContent) {
        document.getElementById('block-news-id').value = newsId;
        document.getElementById('block-modal-title').textContent = `Блокировка новости: "${newsContent.substring(0, 50)}${newsContent.length > 50 ? '...' : ''}"`;
        document.getElementById('block-reason').value = '';
        
        const modal = new bootstrap.Modal(document.getElementById('blockNewsModal'));
        modal.show();
    }

    // Блокировка новости
    async blockNews() {
        const newsId = document.getElementById('block-news-id').value;
        const reason = document.getElementById('block-reason').value;

        if (!reason.trim()) {
            alert('Пожалуйста, укажите причину блокировки');
            return;
        }

        try {
            console.log(`Blocking news ${newsId}...`);
            
            const response = await fetch(`${this.apiBase}/news/${newsId}/block`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    isBlocked: true,
                    blockedReason: reason
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('News blocked:', result);

            // Закрываем модальное окно
            const modal = bootstrap.Modal.getInstance(document.getElementById('blockNewsModal'));
            modal.hide();

            // Показываем уведомление
            this.showSuccess('Новость успешно заблокирована!');

            // Перезагружаем новости
            const userId = document.getElementById('user-select').value;
            if (userId) {
                setTimeout(() => {
                    this.loadNews(userId);
                }, 1000);
            }

        } catch (error) {
            console.error('Error blocking news:', error);
            this.showError('Ошибка при блокировке новости: ' + error.message);
        }
    }

    // Разблокировка новости
    async unblockNews(newsId) {
        if (!confirm('Вы уверены, что хотите разблокировать эту новость?')) {
            return;
        }

        try {
            console.log(`Unblocking news ${newsId}...`);
            
            const response = await fetch(`${this.apiBase}/news/${newsId}/block`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    isBlocked: false,
                    blockedReason: null
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('News unblocked:', result);

            // Показываем уведомление
            this.showSuccess('Новость успешно разблокирована!');

            // Перезагружаем новости
            const userId = document.getElementById('user-select').value;
            if (userId) {
                setTimeout(() => {
                    this.loadNews(userId);
                }, 1000);
            }

        } catch (error) {
            console.error('Error unblocking news:', error);
            this.showError('Ошибка при разблокировке новости: ' + error.message);
        }
    }

    // Просмотр деталей (заглушка)
    viewDetails(newsId) {
        console.log('View news details:', newsId);
        const news = this.currentNews.find(n => n.id === newsId);
        if (news) {
            alert(`Детали новости:\n\nАвтор: ${news.senderName}\nДата: ${this.formatDate(news.timestamp)}\nСтатус: ${news.isBlocked ? 'Заблокирована' : 'Активна'}\nТип: ${news.isPublic ? 'Публичная' : 'Приватная'}\n\nСодержание:\n${news.content}`);
        }
    }

    // Обновление статистики
    updateStatistics(newsItems) {
        const total = newsItems.length;
        const active = newsItems.filter(news => !news.isBlocked).length;
        const blocked = newsItems.filter(news => news.isBlocked).length;

        document.getElementById('total-news').textContent = total;
        document.getElementById('active-news').textContent = active;
        document.getElementById('blocked-news').textContent = blocked;
    }

    // Вспомогательные функции
    generateAvatar(fullName) {
        const initials = fullName
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        
        const colors = ['007bff', '28a745', 'dc3545', 'ffc107', '6f42c1'];
        const color = colors[fullName.length % colors.length];
        
        return `https://via.placeholder.com/40/${color}/ffffff?text=${initials}`;
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleString('ru-RU');
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 60) return `${minutes} мин. назад`;
        if (hours < 24) return `${hours} ч. назад`;
        return `${days} дн. назад`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Выбор пользователя
        const userSelect = document.getElementById('user-select');
        if (userSelect) {
            userSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.loadNews(e.target.value);
                } else {
                    this.clearNewsDisplay();
                }
            });
        }

        // Фильтр новостей
        const newsFilter = document.getElementById('news-filter');
        if (newsFilter) {
            newsFilter.addEventListener('change', () => {
                this.applyFilter();
            });
        }

        // Кнопка обновления
        const refreshBtn = document.getElementById('refresh-news');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                const userId = document.getElementById('user-select').value;
                if (userId) {
                    this.loadNews(userId);
                } else {
                    alert('Сначала выберите пользователя');
                }
            });
        }

        // Кнопка подтверждения блокировки
        const confirmBlockBtn = document.getElementById('confirm-block');
        if (confirmBlockBtn) {
            confirmBlockBtn.addEventListener('click', () => {
                this.blockNews();
            });
        }
    }

    // Очистка отображения новостей
    clearNewsDisplay() {
        const container = document.getElementById('news-container');
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-newspaper display-1 text-muted"></i>
                <p class="mt-3 text-muted">Выберите пользователя для просмотра новостей его друзей</p>
            </div>
        `;

        // Сбрасываем статистику
        this.updateStatistics([]);
    }

    // Функции уведомлений
    showSuccess(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed';
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            <strong>✓ Успех!</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 3000);
    }

    showError(message) {
        alert('Ошибка: ' + message);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing NewsManager...');
    window.newsManager = new NewsManager();
});