console.log('=== USERS.JS LOADED ===');

let currentUsers = [];
let filteredUsers = [];

async function loadUsers() {
    console.log('Starting to load users...');
    
    try {
        const response = await fetch('/api/users');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        currentUsers = await response.json();
        console.log('Users loaded:', currentUsers);
        
        applyFilters();
        
    } catch (error) {
        console.error('Error:', error);
        showError('Ошибка загрузки: ' + error.message);
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const roleFilter = document.getElementById('role-filter').value;
    
    console.log('Applying filters:', { searchTerm, statusFilter, roleFilter });
    
    filteredUsers = currentUsers.filter(user => {
        const matchesSearch = !searchTerm || 
            user.fullName.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || user.status === statusFilter;
        
        const matchesRole = !roleFilter || user.role === roleFilter;
        
        return matchesSearch && matchesStatus && matchesRole;
    });
    
    console.log(`Filtered ${filteredUsers.length} users from ${currentUsers.length}`);
    
    renderUsers(filteredUsers);
}

function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('role-filter').value = '';
    applyFilters();
}
// Функция отображения пользователей
function renderUsers(users) {
    const container = document.getElementById('users-container');
    
    if (!container) {
        console.error('Container #users-container not found!');
        return;
    }
    
    if (!users || users.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="bi bi-search display-4 d-block mb-2"></i>
                <h5>Пользователи не найдены</h5>
                <p class="mb-0">Попробуйте изменить параметры фильтрации</p>
            </div>
        `;
        return;
    }
    
    console.log(`Rendering ${users.length} users...`);
    
    container.innerHTML = users.map(user => `
        <div class="card mb-3 user-card">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-2 text-center">
                        <img src="${user.photo || 'https://via.placeholder.com/80'}" 
                             alt="${user.fullName}" 
                             class="rounded-circle" 
                             width="80" 
                             height="80"
                             style="object-fit: cover;">
                    </div>
                    <div class="col-md-6">
                        <h5 class="card-title mb-2">${user.fullName}</h5>
                        <p class="card-text mb-1">
                            <i class="bi bi-envelope me-2"></i>
                            <strong>Email:</strong> ${user.email}
                        </p>
                        <p class="card-text mb-1">
                            <i class="bi bi-calendar me-2"></i>
                            <strong>Дата рождения:</strong> ${user.birthDate}
                        </p>
                    </div>
                    <div class="col-md-4">
                        <span class="badge ${getRoleBadgeClass(user.role)} me-2">
                            ${getRoleText(user.role)}
                        </span>
                        <span class="badge ${getStatusBadgeClass(user.status)}">
                            ${getStatusText(user.status)}
                        </span>
                        <div class="mt-3">
                            <button class="btn btn-warning btn-sm me-1" onclick="editUser(${user.id})">
                                <i class="bi bi-pencil"></i> Редактировать
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">
                                <i class="bi bi-trash"></i> Удалить
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    updateUsersCount(users.length);
}

function editUser(userId) {
    console.log('Edit user:', userId);
    
    const user = currentUsers.find(u => u.id === userId);
    if (!user) {
        alert('Пользователь не найден');
        return;
    }
    
    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-fullName').value = user.fullName;
    document.getElementById('edit-email').value = user.email;
    document.getElementById('edit-birthDate').value = user.birthDate;
    document.getElementById('edit-role').value = user.role;
    document.getElementById('edit-status').value = user.status;
    
    const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
    modal.show();
}

async function saveUserChanges() {
    const userId = document.getElementById('edit-user-id').value;
    const formData = {
        fullName: document.getElementById('edit-fullName').value.trim(),
        email: document.getElementById('edit-email').value.trim(),
        birthDate: document.getElementById('edit-birthDate').value,
        role: document.getElementById('edit-role').value,
        status: document.getElementById('edit-status').value
    };
    
    if (!formData.fullName || !formData.email || !formData.birthDate) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }
    
    if (!validateFullName(formData.fullName)) {
        alert('ФИО должно содержать только буквы и пробелы, и быть от 2 до 100 символов');
        return;
    }
    
    if (!validateEmail(formData.email)) {
        alert('Пожалуйста, введите корректный email адрес');
        return;
    }
    console.log(!validateBirthDate(formData.birthDate));
    if (!validateBirthDate(formData.birthDate)) {
        alert('Дата рождения не может быть в будущем и пользователь должен быть старше 13 лет');
        return;
    }

    
    try {
        console.log('Saving user changes:', userId, formData);
        
        const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const updatedUser = await response.json();
        console.log('User updated:', updatedUser);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
        modal.hide();
        
        showSuccess('Пользователь успешно обновлен!');
        
        setTimeout(() => {
            loadUsers();
        }, 1000);
        
    } catch (error) {
        console.error('Error updating user:', error);
        showError('Ошибка при обновлении пользователя: ' + error.message);
    }
}

function validateFullName(fullName) {
    const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s\-']{2,100}$/;
    return nameRegex.test(fullName);
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
        return false;
    }
    
    if (email.length > 254) {
        return false;
    }
    
    const domainPart = email.split('@')[1];
    if (!domainPart.includes('.')) {
        return false;
    }
    
    return true;
}

function validateBirthDate(birthDate) {
    const inputDate = new Date(birthDate);
    const currentDate = new Date();
    
    if (isNaN(inputDate.getTime())) {
        return false;
    }
    
    if (inputDate > currentDate) {
        return false;
    }
    
    const minBirthDate = new Date();
    minBirthDate.setFullYear(currentDate.getFullYear() - 13);
    
    if (inputDate > minBirthDate) {
        return false;
    }
    
    const maxBirthDate = new Date();
    maxBirthDate.setFullYear(currentDate.getFullYear() - 150);
    
    if (inputDate < maxBirthDate) {
        return false;
    }
    
    return true;
}

async function checkEmailUnique(email, currentUserId) {
    try {
        const response = await fetch(`/api/users/check-email?email=${encodeURIComponent(email)}&excludeUserId=${currentUserId}`);
        if (response.ok) {
            const result = await response.json();
            return !result.exists; 
        }
        return true; 
    } catch (error) {
        console.error('Error checking email uniqueness:', error);
        return true; 
    }
}
async function deleteUser(userId) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.')) {
        return;
    }
    
    try {
        console.log('Deleting user:', userId);
        
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('User deleted:', result);
        
        showSuccess('Пользователь успешно удален!');
        
        setTimeout(() => {
            loadUsers();
        }, 1000);
        
    } catch (error) {
        console.error('Error deleting user:', error);
        showError('Ошибка при удалении пользователя: ' + error.message);
    }
}

function getRoleBadgeClass(role) {
    return role === 'admin' ? 'bg-primary' : 'bg-secondary';
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'active': return 'bg-success';
        case 'pending': return 'bg-warning';
        case 'blocked': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

function getRoleText(role) {
    return role === 'admin' ? 'Администратор' : 'Пользователь';
}

function getStatusText(status) {
    switch(status) {
        case 'active': return 'Активный';
        case 'pending': return 'Не подтверждённый';
        case 'blocked': return 'Заблокированный';
        default: return status;
    }
}

function updateUsersCount(count) {
    const countElement = document.getElementById('users-count');
    if (countElement) {
        countElement.textContent = count;
    }
}

function showError(message) {
    alert('Ошибка: ' + message);
}

function showSuccess(message) {
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

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting user load...');
    loadUsers();
    
    const refreshBtn = document.getElementById('refresh-users');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadUsers);
    }
    
    const saveBtn = document.getElementById('save-user-changes');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveUserChanges);
    }
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const roleFilter = document.getElementById('role-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    if (roleFilter) {
        roleFilter.addEventListener('change', applyFilters);
    }
});

window.loadUsers = loadUsers;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.saveUserChanges = saveUserChanges;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;