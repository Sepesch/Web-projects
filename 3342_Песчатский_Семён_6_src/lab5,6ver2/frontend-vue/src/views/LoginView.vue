<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <h1>Вход в систему</h1>
        <p class="login-description">
          Войдите в свою учетную запись брокера для доступа к торговой платформе
        </p>
      </div>

      <!-- Сообщение об ошибке -->
      <div v-if="error" class="error-message">
        <strong>Ошибка:</strong> {{ error }}
        <button @click="clearError" class="error-close">×</button>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="brokerSelect">Выберите брокера <span class="label-required">*</span></label>
          <select
            id="brokerSelect"
            v-model="selectedBrokerId"
            :disabled="loading || brokers.length === 0"
            class="form-input"
          >
            <option value="">-- Выберите брокера --</option>
            <option v-for="broker in brokers" :key="broker.id" :value="broker.id">
              {{ broker.name }} (Баланс: ${{ formatCurrency(broker.currentFunds) }})
            </option>
          </select>
          <div class="form-hint" v-if="brokers.length === 0">
            Нет доступных брокеров. Обратитесь к администратору.
          </div>
        </div>

        <div class="form-info">
          <div class="info-item" v-if="selectedBroker">
            <span class="info-label">Выбранный брокер:</span>
            <span class="info-value">{{ selectedBroker.name }}</span>
          </div>
          <div class="info-item" v-if="selectedBroker">
            <span class="info-label">Текущий баланс:</span>
            <span class="info-value">${{ formatCurrency(selectedBroker.currentFunds) }}</span>
          </div>
          <div class="info-item" v-if="selectedBroker">
            <span class="info-label">Начальный капитал:</span>
            <span class="info-value">${{ formatCurrency(selectedBroker.initialFunds) }}</span>
          </div>
        </div>

        <div class="control-buttons">
          <button 
            type="submit" 
            class="btn btn-primary btn-login"
            :disabled="loading || !selectedBrokerId || brokers.length === 0"
          >
            {{ loading ? 'Вход...' : 'Войти в систему' }}
          </button>
        </div>
      </form>

      <div class="login-footer">
        <p>Нет доступа? <a href="#" @click.prevent="showAdminInfo">Обратитесь к администратору</a></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBrokerStore } from '../stores/broker'
import { brokerService } from '../services/brokerService'

const router = useRouter()
const brokerStore = useBrokerStore()

const brokers = ref([])
const selectedBrokerId = ref('')
const loading = ref(false)
const error = ref('')

const selectedBroker = computed(() => {
  return brokers.value.find(broker => broker.id === selectedBrokerId.value)
})

onMounted(() => {
  loadBrokers()
  checkStoredBroker()
})

// Проверяем сохраненного брокера в localStorage
function checkStoredBroker() {
  const storedBrokerId = localStorage.getItem('brokerId')
  if (storedBrokerId) {
    selectedBrokerId.value = storedBrokerId
    // Автоматический вход если есть сохраненный брокер
    handleLogin()
  }
}

async function loadBrokers() {
  try {
    loading.value = true
    const response = await brokerService.getBrokers()
    brokers.value = response.data
    
    // Если есть сохраненный брокер, проверяем его существование
    const storedBrokerId = localStorage.getItem('brokerId')
    if (storedBrokerId) {
      const storedBroker = brokers.value.find(b => b.id.toString() === storedBrokerId)
      if (!storedBroker) {
        // Если сохраненный брокер не найден в списке, очищаем localStorage
        localStorage.removeItem('brokerId')
        selectedBrokerId.value = ''
      }
    }
  } catch (err) {
    console.error('Ошибка загрузки брокеров:', err)
    error.value = 'Ошибка загрузки списка брокеров'
  } finally {
    loading.value = false
  }
}

async function handleLogin() {
  if (!selectedBrokerId.value) return

  try {
    loading.value = true
    const broker = brokers.value.find(b => b.id === selectedBrokerId.value)
    if (broker) {
      localStorage.setItem('brokerId', broker.id.toString())
      
      brokerStore.currentBroker = broker
      
      await brokerStore.loadBrokerData()
      
      router.push('/dashboard')
    }
    error.value = ''
  } catch (err) {
    console.error('Ошибка входа:', err)
    error.value = err.response?.data?.message || 'Ошибка входа в систему'
    
    // При ошибке входа очищаем сохраненного брокера
    localStorage.removeItem('brokerId')
  } finally {
    loading.value = false
  }
}

function showAdminInfo() {
  alert('Для получения доступа к системе обратитесь к администратору платформы.')
}

function clearError() {
  error.value = ''
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-container {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
  border: 1px solid #e1e8ed;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 2.2em;
  font-weight: 600;
  text-align: center;
}

.login-description {
  color: #7f8c8d;
  font-size: 1em;
  line-height: 1.5;
  text-align: center;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #2c3e50;
  text-align: left;
}

.label-required {
  color: #e74c3c;
}

.form-input {
  padding: 12px 15px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1em;
  transition: all 0.3s;
  background: white;
  text-align: left;
  color: #2c3e50;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  color: #2c3e50;
}

.form-input:disabled {
  background: #f8f9fa;
  color: #7f8c8d;
  cursor: not-allowed;
}

.form-input option {
  color: #2c3e50;
  background: white;
}

.form-input:disabled option {
  color: #7f8c8d;
}

.form-hint {
  font-size: 0.85em;
  color: #7f8c8d;
  margin-top: 4px;
  text-align: left;
}

.form-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #7f8c8d;
  font-size: 0.9em;
  text-align: left;
}

.info-value {
  font-weight: 600;
  color: #2c3e50;
  text-align: right;
}

.control-buttons {
  margin-top: 10px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
  text-align: center;
  color: white;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  color: white;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  color: white;
}

.login-footer {
  text-align: center;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #e1e8ed;
}

.login-footer p {
  color: #7f8c8d;
  font-size: 0.9em;
  text-align: center;
}

.login-footer a {
  color: #3498db;
  text-decoration: none;
  font-weight: 500;
}

.login-footer a:hover {
  text-decoration: underline;
}

.error-message {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
  text-align: left;
}

.error-close {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s ease;
}

.error-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-container {
  animation: fadeIn 0.6s ease-out;
}

@media (max-width: 480px) {
  .login-container {
    padding: 30px 20px;
    margin: 10px;
  }
  
  .login-header h1 {
    font-size: 1.8em;
  }
  
  .info-item {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }
  
  .info-label,
  .info-value {
    text-align: left;
  }
}
</style>