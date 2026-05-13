console.log('=== FRIENDS.JS LOADED ===');

class FriendsManager {
    constructor() {
        this.apiBase = '/api';
        this.users = [];
        this.currentUserFriends = [];
        this.init();
    }

    async init() {
        console.log('FriendsManager initialized');
        await this.loadUsers();
        this.setupEventListeners();
    }

    // Загрузка списка пользователей для выбора
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

    // Отображение выпадающего списка пользователей
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

    // Загрузка друзей выбранного пользователя
    async loadFriends(userId) {
        const container = document.getElementById('friends-container');
        
        try {
            // Показываем загрузку
            container.innerHTML = `
                <div class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Загрузка...</span>
                    </div>
                    <p class="mt-2 text-muted">Загрузка списка друзей...</p>
                </div>
            `;

            console.log(`Loading friends for user ${userId}...`);
            const response = await fetch(`${this.apiBase}/friends/${userId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.currentUserFriends = data.friends || [];
            console.log(`Loaded ${this.currentUserFriends.length} friends`);
            
            this.renderFriends(this.currentUserFriends);
            this.updateStatistics(this.currentUserFriends);
            
        } catch (error) {
            console.error('Error loading friends:', error);
            container.innerHTML = `
                <div class="alert alert-danger">
                    <h5><i class="bi bi-exclamation-triangle"></i> Ошибка загрузки</h5>
                    <p>${error.message}</p>
                    <button class="btn btn-warning mt-2" onclick="friendsManager.loadFriends(${userId})">
                        <i class="bi bi-arrow-clockwise"></i> Попробовать снова
                    </button>
                </div>
            `;
        }
    }

    // Отображение списка друзей
    renderFriends(friends) {
        const container = document.getElementById('friends-container');
        
        if (!friends || friends.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="bi bi-person-x display-1 text-muted"></i>
                    <p class="mt-3 text-muted">У пользователя нет друзей</p>
                </div>
            `;
            return;
        }

        container.innerHTML = friends.map(friend => `
            <div class="card mb-3 friend-card">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-2 text-center">
                            <img src="${friend.photo || this.generateAvatar(friend.fullName)}" 
                                 alt="${friend.fullName}" 
                                 class="rounded-circle" 
                                 width="80" 
                                 height="80"
                                 style="object-fit: cover;"
                                 onerror="this.src='https://via.placeholder.com/80/6c757d/ffffff?text=?'">
                        </div>
                        <div class="col-md-6">
                            <h5 class="card-title mb-2">${friend.fullName}</h5>
                            <p class="card-text mb-1">
                                <i class="bi bi-envelope me-2"></i>
                                <strong>Email:</strong> ${friend.email}
                            </p>
                            <p class="card-text mb-1">
                                <i class="bi bi-calendar-event me-2"></i>
                                <strong>Статус:</strong> ${this.getStatusText(friend.status)}
                            </p>
                        </div>
                        <div class="col-md-4 text-end">
                            <span class="badge ${this.getStatusBadgeClass(friend.status)} me-2">
                                ${this.getStatusText(friend.status)}
                            </span>
                            <div class="mt-2">
                                <button class="btn btn-outline-primary btn-sm me-1" onclick="friendsManager.viewProfile(${friend.id})">
                                    <i class="bi bi-eye"></i> Профиль
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="friendsManager.removeFriend(${friend.id})">
                                    <i class="bi bi-person-dash"></i> Удалить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Обновляем счетчик
        this.updateFriendsCount(friends.length);
    }

    // Обновление статистики
    updateStatistics(friends) {
        const total = friends.length;
        const active = friends.filter(f => f.status === 'active').length;
        const pending = friends.filter(f => f.status === 'pending').length;
        const blocked = friends.filter(f => f.status === 'blocked').length;

        document.getElementById('total-friends').textContent = total;
        document.getElementById('active-friends').textContent = active;
        document.getElementById('pending-friends').textContent = pending;
        document.getElementById('blocked-friends').textContent = blocked;
    }

    // Обновление счетчика друзей
    updateFriendsCount(count) {
        const countElement = document.getElementById('friends-count');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    // Удаление друга
    async removeFriend(friendId) {
        const userId = document.getElementById('user-select').value;
        if (!userId) {
            alert('Сначала выберите пользователя');
            return;
        }

        if (!confirm('Вы уверены, что хотите удалить этого пользователя из друзей?')) {
            return;
        }

        try {
            console.log(`Removing friend ${friendId} from user ${userId}`);
            
            const response = await fetch(`${this.apiBase}/friends/${userId}/${friendId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Friend removed:', result);

            // Показываем уведомление
            this.showSuccess('Пользователь удален из друзей!');

            // Перезагружаем список друзей
            setTimeout(() => {
                this.loadFriends(userId);
            }, 1000);

        } catch (error) {
            console.error('Error removing friend:', error);
            this.showError('Ошибка при удалении друга: ' + error.message);
        }
    }

    // Просмотр профиля (заглушка)
    viewProfile(userId) {
        console.log('View profile:', userId);
        alert(`Просмотр профиля пользователя ID: ${userId} (функция в разработке)`);
    }

    // Генерация аватара
    generateAvatar(fullName) {
        const initials = fullName
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        
        const colors = ['007bff', '28a745', 'dc3545', 'ffc107', '6f42c1'];
        const color = colors[fullName.length % colors.length];
        
        return `https://via.placeholder.com/80/${color}/ffffff?text=${initials}`;
    }

    // Вспомогательные функции
    getStatusBadgeClass(status) {
        switch(status) {
            case 'active': return 'bg-success';
            case 'pending': return 'bg-warning';
            case 'blocked': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }

    getStatusText(status) {
        switch(status) {
            case 'active': return 'Активный';
            case 'pending': return 'Не подтверждённый';
            case 'blocked': return 'Заблокированный';
            default: return status;
        }
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Выбор пользователя
        const userSelect = document.getElementById('user-select');
        if (userSelect) {
            userSelect.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.loadFriends(e.target.value);
                } else {
                    this.clearFriendsDisplay();
                }
            });
        }

        // Кнопка обновления
        const refreshBtn = document.getElementById('refresh-friends');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                const userId = document.getElementById('user-select').value;
                if (userId) {
                    this.loadFriends(userId);
                } else {
                    alert('Сначала выберите пользователя');
                }
            });
        }
    }

    // Очистка отображения друзей
    clearFriendsDisplay() {
        const container = document.getElementById('friends-container');
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-person-plus display-1 text-muted"></i>
                <p class="mt-3 text-muted">Выберите пользователя для просмотра списка его друзей</p>
            </div>
        `;

        // Сбрасываем статистику
        this.updateStatistics([]);
        this.updateFriendsCount(0);
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
    console.log('DOM loaded, initializing FriendsManager...');
    window.friendsManager = new FriendsManager();
});