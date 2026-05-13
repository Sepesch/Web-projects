<template>
  <div class="admin-brokers-page">
    <div class="page-header">
      <h1>Управление участниками торгов</h1>
      <p class="page-description">
        Просмотр баланса, портфеля акций и финансовых результатов всех участников торговой сессии.
      </p>
    </div>

    <!-- Сообщение об ошибке -->
    <div v-if="error" class="error-message">
      <strong>Ошибка:</strong> {{ error }}
      <button @click="clearError" class="error-close">×</button>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Загрузка данных...</p>
    </div>

    <!-- Текущая дата торгов -->
    <div class="trading-date-panel" v-if="currentDate">
      <div class="date-info">
        <span class="date-label">Текущая дата торгов:</span>
        <span class="date-value">{{ currentDate }}</span>
      </div>
    </div>

    <div class="brokers-list-section">
      <div class="section-header">
        <h2>Участники торгов</h2>
        <div class="stats-info">
          <span class="stat">Всего: {{ brokers.length }}</span>
          <span class="stat">Активных: {{ activeBrokersCount }}</span>
        </div>
      </div>

      <div class="brokers-content">
        <div v-if="brokers.length === 0" class="empty-state">
          <div class="empty-icon">👤</div>
          <h3>Участники не найдены</h3>
          <p>Нет зарегистрированных участников торгов</p>
        </div>

        <div v-else class="brokers-grid">
          <div 
            v-for="broker in brokers" 
            :key="broker.id" 
            class="broker-card"
          >
            <div class="broker-header">
              <div class="broker-main-info">
                <h3 class="broker-name">{{ broker.name }}</h3>
                <div class="broker-id">ID: {{ broker.id }}</div>
              </div>
              <div class="broker-status" :class="getBrokerStatus(broker)">
                {{ getBrokerStatusText(broker) }}
              </div>
            </div>

            <!-- Баланс и общая информация -->
            <div class="broker-balance-info">
              <div class="balance-item">
                <span class="balance-label">Начальный капитал:</span>
                <span class="balance-value">${{ formatCurrency(broker.initialFunds) }}</span>
              </div>
              <div class="balance-item">
                <span class="balance-label">Текущий баланс:</span>
                <span class="balance-value">${{ formatCurrency(broker.currentFunds) }}</span>
              </div>
              <div class="balance-item">
                <span class="balance-label">Общая прибыль/убыток:</span>
                <span class="balance-value" :class="getTotalProfitClass(broker)">
                  {{ getTotalProfit(broker) >= 0 ? '+' : '' }}${{ formatCurrency(getTotalProfit(broker)) }}
                  ({{ getTotalProfitPercent(broker) >= 0 ? '+' : '' }}{{ getTotalProfitPercent(broker).toFixed(2) }}%)
                </span>
              </div>
            </div>

            <!-- Портфель акций -->
            <div class="portfolio-section">
              <h4>Портфель акций</h4>
              <div class="stocks-table">
                <div class="table-header">
                  <span class="col-symbol">Акция</span>
                  <span class="col-quantity">Кол-во</span>
                  <span class="col-price">Цена покупки</span>
                  <span class="col-current">Текущая цена</span>
                  <span class="col-profit">Прибыль/убыток</span>
                </div>
                <div v-if="broker.portfolio && broker.portfolio.length > 0">
                  <div 
                    v-for="stock in broker.portfolio" 
                    :key="stock.symbol"
                    class="table-row"
                  >
                    <span class="col-symbol">
                      <strong>{{ stock.symbol }}</strong>
                      <div class="stock-name">{{ getStockName(stock.symbol) }}</div>
                    </span>
                    <span class="col-quantity">{{ stock.quantity }} шт.</span>
                    <span class="col-price">${{ formatCurrency(stock.purchasePrice) }}</span>
                    <span class="col-current">${{ formatCurrency(getCurrentPrice(stock.symbol)) }}</span>
                    <span class="col-profit" :class="getStockProfitClass(stock)">
                      {{ getStockProfit(stock) >= 0 ? '+' : '' }}${{ formatCurrency(getStockProfit(stock)) }}
                      ({{ getStockProfitPercent(stock) >= 0 ? '+' : '' }}{{ getStockProfitPercent(stock).toFixed(2) }}%)
                    </span>
                  </div>
                </div>
                <div v-else class="empty-portfolio">
                  Портфель пуст
                </div>
              </div>
            </div>

            <!-- Сводка по портфелю -->
            <div class="portfolio-summary">
              <div class="summary-item">
                <span class="summary-label">Всего акций:</span>
                <span class="summary-value">{{ getTotalStocksCount(broker) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Стоимость портфеля:</span>
                <span class="summary-value">${{ formatCurrency(getPortfolioValue(broker)) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Прибыль портфеля:</span>
                <span class="summary-value" :class="getPortfolioProfitClass(broker)">
                  {{ getPortfolioProfit(broker) >= 0 ? '+' : '' }}${{ formatCurrency(getPortfolioProfit(broker)) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { brokerService } from '../services/brokerService'

const brokers = ref([])

// Текущие цены акций (в реальном приложении получать из API)
const currentPrices = ref({
  'AAPL': 155.50,
  'GOOGL': 2850.75,
  'TSLA': 195.25,
  'MSFT': 310.20,
  'AMZN': 3400.00
})

const stockNames = {
  'AAPL': 'Apple Inc.',
  'GOOGL': 'Alphabet Inc.',
  'TSLA': 'Tesla Inc.',
  'MSFT': 'Microsoft Corporation',
  'AMZN': 'Amazon.com Inc.'
}

const currentDate = ref('15.03.2024')
const loading = ref(false)
const error = ref('')

const activeBrokersCount = computed(() => {
  return brokers.value.filter(broker => broker.portfolio && broker.portfolio.length > 0).length
})

onMounted(() => {
  loadBrokersData()
})

async function loadBrokersData() {
  try {
    loading.value = true
    error.value = ''
    
    // Загружаем брокеров через API, как в LoginView
    const response = await brokerService.getBrokers()
    brokers.value = response.data
    
    // Для каждого брокера загружаем дополнительную информацию
    await Promise.all(
      brokers.value.map(async (broker) => {
        try {
          // Сохраняем текущий brokerId для запроса
          const currentBrokerId = localStorage.getItem('brokerId')
          
          // Временно устанавливаем ID текущего брокера для загрузки его данных
          localStorage.setItem('brokerId', broker.id.toString())
          
          // Загружаем информацию о портфеле брокера
          const stocksResponse = await brokerService.getStocks()
          const brokerStocks = stocksResponse.data.stocks || {}
          
          // Формируем портфель брокера
          broker.portfolio = Object.entries(brokerStocks).map(([symbol, quantity]) => {
            const currentPrice = currentPrices.value[symbol] || 0
            return {
              symbol: symbol,
              quantity: quantity,
              purchasePrice: currentPrice * 0.95, // Примерная цена покупки (95% от текущей)
              currentPrice: currentPrice
            }
          })
          
          // Восстанавливаем оригинальный brokerId
          if (currentBrokerId) {
            localStorage.setItem('brokerId', currentBrokerId)
          } else {
            localStorage.removeItem('brokerId')
          }
          
        } catch (err) {
          console.error(`Error loading portfolio for broker ${broker.id}:`, err)
          broker.portfolio = []
        }
      })
    )
    
  } catch (err) {
    console.error('Ошибка загрузки данных участников:', err)
    error.value = 'Ошибка загрузки данных участников'
  } finally {
    loading.value = false
  }
}

function getStockName(symbol) {
  return stockNames[symbol] || symbol
}

function getCurrentPrice(symbol) {
  return currentPrices.value[symbol] || 0
}

function getStockProfit(stock) {
  const currentPrice = getCurrentPrice(stock.symbol)
  return (currentPrice - stock.purchasePrice) * stock.quantity
}

function getStockProfitPercent(stock) {
  return ((getCurrentPrice(stock.symbol) - stock.purchasePrice) / stock.purchasePrice) * 100
}

function getStockProfitClass(stock) {
  const profit = getStockProfit(stock)
  return profit >= 0 ? 'profit-positive' : 'profit-negative'
}

function getTotalProfit(broker) {
  return broker.currentFunds - broker.initialFunds
}

function getTotalProfitPercent(broker) {
  return ((broker.currentFunds - broker.initialFunds) / broker.initialFunds) * 100
}

function getTotalProfitClass(broker) {
  const profit = getTotalProfit(broker)
  return profit >= 0 ? 'profit-positive' : 'profit-negative'
}

function getPortfolioValue(broker) {
  if (!broker.portfolio) return 0
  return broker.portfolio.reduce((total, stock) => {
    return total + (getCurrentPrice(stock.symbol) * stock.quantity)
  }, 0)
}

function getPortfolioProfit(broker) {
  if (!broker.portfolio) return 0
  return broker.portfolio.reduce((total, stock) => {
    return total + getStockProfit(stock)
  }, 0)
}

function getPortfolioProfitClass(broker) {
  const profit = getPortfolioProfit(broker)
  return profit >= 0 ? 'profit-positive' : 'profit-negative'
}

function getTotalStocksCount(broker) {
  if (!broker.portfolio) return 0
  return broker.portfolio.reduce((total, stock) => total + stock.quantity, 0)
}

function getBrokerStatus(broker) {
  if (broker.portfolio && broker.portfolio.length > 0) {
    const profit = getTotalProfit(broker)
    return profit >= 0 ? 'active-profit' : 'active-loss'
  }
  return 'inactive'
}

function getBrokerStatusText(broker) {
  if (broker.portfolio && broker.portfolio.length > 0) {
    const profit = getTotalProfit(broker)
    return profit >= 0 ? 'В прибыли' : 'В убытке'
  }
  return 'Не активен'
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

function clearError() {
  error.value = ''
}
</script>

<style scoped>
.admin-brokers-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 2.5em;
}

.page-description {
  color: #7f8c8d;
  font-size: 1.1em;
  line-height: 1.5;
  max-width: 800px;
  margin: 0 auto;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.trading-date-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 25px;
  border-radius: 10px;
  margin-bottom: 25px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.date-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date-label {
  font-weight: 600;
  font-size: 1.1em;
}

.date-value {
  font-size: 1.2em;
  font-weight: 700;
}

.brokers-list-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  overflow: hidden;
}

.section-header {
  background: #34495e;
  color: white;
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5em;
  font-weight: 600;
}

.stats-info {
  display: flex;
  gap: 20px;
}

.stat {
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 0.9em;
}

.brokers-content {
  padding: 30px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.empty-icon {
  font-size: 4em;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.5em;
  margin-bottom: 10px;
  color: #95a5a6;
}

.brokers-grid {
  display: grid;
  gap: 25px;
}

.broker-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 25px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.broker-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: #3498db;
  transition: width 0.3s ease;
}

.broker-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
  border-color: #3498db;
}

.broker-card:hover::before {
  width: 6px;
}

.broker-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e9ecef;
}

.broker-main-info {
  flex: 1;
}

.broker-name {
  font-size: 1.4em;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 5px 0;
}

.broker-id {
  color: #7f8c8d;
  font-size: 0.9em;
}

.broker-status {
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 0.85em;
  font-weight: 600;
}

.broker-status.active-profit {
  background: #e8f5e8;
  color: #2e7d32;
}

.broker-status.active-loss {
  background: #ffebee;
  color: #d32f2f;
}

.broker-status.inactive {
  background: #f5f5f5;
  color: #757575;
}

.broker-balance-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 25px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.balance-label {
  color: #7f8c8d;
  font-size: 0.9em;
}

.balance-value {
  font-weight: 600;
  color: #2c3e50;
}

.profit-positive {
  color: #2e7d32;
}

.profit-negative {
  color: #d32f2f;
}

.portfolio-section {
  margin-bottom: 20px;
}

.portfolio-section h4 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.1em;
}

.stocks-table {
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
  gap: 15px;
  padding: 15px 20px;
  background: #34495e;
  color: white;
  font-weight: 600;
  font-size: 0.9em;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
  gap: 15px;
  padding: 12px 20px;
  border-bottom: 1px solid #e9ecef;
  align-items: center;
}

.table-row:last-child {
  border-bottom: none;
}

.col-symbol {
  display: flex;
  flex-direction: column;
}

.col-symbol strong {
  color: #2c3e50;
  margin-bottom: 2px;
}

.stock-name {
  font-size: 0.8em;
  color: #7f8c8d;
}

.col-quantity,
.col-price,
.col-current,
.col-profit {
  font-weight: 600;
}

.empty-portfolio {
  padding: 30px 20px;
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
}

.portfolio-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  color: #7f8c8d;
  font-size: 0.9em;
}

.summary-value {
  font-weight: 600;
  color: #2c3e50;
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

@media (max-width: 1024px) {
  .brokers-content {
    padding: 20px;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
    text-align: center;
  }
  
  .broker-balance-info {
    grid-template-columns: 1fr;
  }
  
  .portfolio-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .admin-brokers-page {
    padding: 15px;
  }
  
  .broker-header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .section-header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .stats-info {
    justify-content: center;
  }
}
</style>