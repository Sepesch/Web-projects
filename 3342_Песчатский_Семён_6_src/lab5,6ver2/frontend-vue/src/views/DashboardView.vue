<template>
  <div class="dashboard">
    <div class="header">
      <h1>Торговая площадка</h1>
      <div class="current-date">
        Текущая дата: <strong>{{ currentDate || '—' }}</strong>
      </div>
    </div>

    <div v-if="error" class="error">
      {{ error }}
      <button @click="clearError">×</button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
    </div>

    <div class="info-panel">
      <div class="funds">
        <span>Доступные средства:</span>
        <span class="amount">${{ brokerStore.formatCurrency(brokerStore.balance) }}</span>
      </div>
      <button @click="resetAllCharts" class="reset-charts-btn" title="Сбросить все графики">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.1-6.3M22 12.5a10 10 0 0 1-18.1 6.2"/>
        </svg>
        Сбросить графики
      </button>
    </div>

    <div class="content">
      <div class="panel">
        <div class="panel-header">
          <h2>Акции на торгах</h2>
          <div class="stocks-count">{{ tradingStocks.length }} акций</div>
        </div>
        <div class="stocks-grid">
          <div v-if="tradingStocks.length === 0" class="empty">
            Акции не найдены
          </div>
          <div v-else v-for="stock in tradingStocks" :key="stock.symbol" class="stock-card">
            <div class="stock-header">
              <div class="symbol">{{ stock.symbol }}</div>
              <div class="price">${{ brokerStore.formatCurrency(getStockCurrentPrice(stock.symbol)) }}</div>
            </div>
            <div class="name">{{ stock.name }}</div>
            
            <!-- Мини-график для акции -->
            <div class="mini-chart-container">
              <div class="mini-chart">
                <div v-if="getChartHistoryForStock(stock.symbol).length > 0" class="chart-line">
                  <svg :width="chartWidth" :height="chartHeight" class="chart-svg">
                    <!-- Линия графика -->
                    <path 
                      :d="getChartPath(stock.symbol)" 
                      fill="none" 
                      stroke="#3498db" 
                      stroke-width="2"
                    />
                    <!-- Последняя точка -->
                    <circle 
                      :cx="getLastPointX(stock.symbol)" 
                      :cy="getLastPointY(stock.symbol)" 
                      r="3" 
                      fill="#3498db"
                      stroke="white"
                      stroke-width="1"
                    />
                  </svg>
                </div>
                <div v-else class="no-chart-data">
                  Нет данных для графика
                </div>
              </div>
              <div class="chart-info">
                <span class="change-indicator" :class="getPriceChangeClassForStock(stock.symbol)">
                  {{ getPriceChangeText(stock.symbol) }}
                </span>
              </div>
            </div>
            
            <div class="actions">
              <button 
                @click="openBuyDialog(stock)" 
                :disabled="brokerStore.balance < getStockCurrentPrice(stock.symbol)"
                class="buy-btn"
              >
                Купить
              </button>
              <button 
                @click="openChartDialog(stock)"
                class="chart-btn"
              >
                График
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h2>Мой портфель</h2>
              <div :class="getProfileProfitClass()">
               ${{ brokerStore.getPortfolioValue() }}
                <!-- <span v-if="stock.purchasePrice && getStockCurrentPrice(stock.symbol) > 0" class="profit-percent">
                  ({{ getStockProfitPercent(stock) }}%)
                </span> -->
              </div>
        </div>
        <div class="stocks-grid">
          <div v-if="brokerStore.enabledPortfolioStocks.length === 0" class="empty">
            Портфель пуст или акции отключены
          </div>
          <div v-else v-for="stock in brokerStore.enabledPortfolioStocks" :key="stock.symbol" class="stock-card">
            <div class="stock-header">
              <div class="symbol">{{ stock.symbol }}</div>
              <div class="price">${{ brokerStore.formatCurrency(getStockCurrentPrice(stock.symbol)) }}</div>
            </div>
            <div class="details">
              <div><strong>Количество:</strong> {{ stock.quantity }} шт.</div>
              <div><strong>Стоимость:</strong> ${{ brokerStore.formatCurrency(stock.quantity * getStockCurrentPrice(stock.symbol)) }}</div>
              <div :class="getStockProfitClass(stock)">
                <strong>Прибыль/убыток:</strong> ${{ brokerStore.formatCurrency(getStockProfit(stock)) }}
                <span v-if="stock.purchasePrice && getStockCurrentPrice(stock.symbol) > 0" class="profit-percent">
                  ({{ getStockProfitPercent(stock) }}%)
                </span>
              </div>
            </div>
            
            <!-- Мини-график для портфельной акции -->
            <div class="mini-chart-container">
              <div class="mini-chart">
                <div v-if="getChartHistoryForStock(stock.symbol).length > 0" class="chart-line">
                  <svg :width="chartWidth" :height="chartHeight" class="chart-svg">
                    <!-- Линия графика -->
                    <path 
                      :d="getChartPath(stock.symbol)" 
                      fill="none" 
                      :stroke="getChartColor(stock)" 
                      stroke-width="2"
                    />
                    <!-- Последняя точка -->
                    <circle 
                      :cx="getLastPointX(stock.symbol)" 
                      :cy="getLastPointY(stock.symbol)" 
                      r="3" 
                      :fill="getChartColor(stock)"
                      stroke="white"
                      stroke-width="1"
                    />
                  </svg>
                </div>
                <div v-else class="no-chart-data">
                  Нет данных для графика
                </div>
              </div>
              <div class="chart-info">
                <span class="change-indicator" :class="getPriceChangeClassForStock(stock.symbol)">
                  {{ getPriceChangeText(stock.symbol) }}
                </span>
                <span v-if="stock.purchasePrice" class="purchase-price">
                  Покупка: ${{ brokerStore.formatCurrency(stock.purchasePrice) }}
                </span>
              </div>
            </div>
            
            <div class="actions">
              <button 
                @click="openSellDialog(stock)" 
                class="sell-btn"
              >
                Продать
              </button>
              <button 
                @click="openChartDialog(stock)"
                class="chart-btn"
              >
                График
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Диалог покупки -->
    <div v-if="showBuyDialog" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Покупка {{ selectedStock?.symbol }}</h3>
          <button @click="closeBuyDialog">×</button>
        </div>
        <div class="modal-body">
          <div class="info">
            <div><strong>Акция:</strong> {{ selectedStock?.name }}</div>
            <div><strong>Текущая цена:</strong> ${{ brokerStore.formatCurrency(getStockCurrentPrice(selectedStock?.symbol)) }}</div>
            <div><strong>Ваши средства:</strong> ${{ brokerStore.formatCurrency(brokerStore.balance) }}</div>
            <div><strong>Максимально можно купить:</strong> {{ getMaxBuyQuantity() }} шт.</div>
          </div>
          <div class="input-group">
            <label for="buyQuantity">Количество для покупки:</label>
            <input 
              id="buyQuantity"
              type="number" 
              v-model="buyQuantity" 
              :min="1" 
              :max="getMaxBuyQuantity()"
              @input="validateBuyQuantity"
              placeholder="Введите количество"
            >
          </div>
          <div class="summary">
            <div><strong>Общая стоимость:</strong> ${{ brokerStore.formatCurrency(getTransactionTotal()) }}</div>
            <div><strong>Останется средств:</strong> ${{ brokerStore.formatCurrency(brokerStore.balance - getTransactionTotal()) }}</div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeBuyDialog" class="cancel-btn">Отмена</button>
          <button 
            @click="executeBuy" 
            :disabled="!canBuy"
            class="confirm-btn"
          >
            Купить
          </button>
        </div>
      </div>
    </div>

    <!-- Диалог продажи -->
    <div v-if="showSellDialog" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Продажа {{ selectedStock?.symbol }}</h3>
          <button @click="closeSellDialog">×</button>
        </div>
        <div class="modal-body">
          <div class="info">
            <div><strong>Акция:</strong> {{ selectedStock?.name }}</div>
            <div><strong>Текущая цена:</strong> ${{ brokerStore.formatCurrency(getStockCurrentPrice(selectedStock?.symbol)) }}</div>
            <div><strong>В вашем портфеле:</strong> {{ selectedStock?.quantity }} шт.</div>
            <div :class="getStockProfitClass(selectedStock)">
              <strong>Прибыль/убыток:</strong> ${{ brokerStore.formatCurrency(getStockProfit(selectedStock)) }}
              <span v-if="selectedStock?.purchasePrice && getStockCurrentPrice(selectedStock?.symbol) > 0" class="profit-percent">
                ({{ getStockProfitPercent(selectedStock) }}%)
              </span>
            </div>
          </div>
          <div class="input-group">
            <label for="sellQuantity">Количество для продажи:</label>
            <input 
              id="sellQuantity"
              type="number" 
              v-model="sellQuantity" 
              :min="1" 
              :max="selectedStock?.quantity"
              @input="validateSellQuantity"
              placeholder="Введите количество"
            >
          </div>
          <div class="summary">
            <div><strong>Вы получите:</strong> ${{ brokerStore.formatCurrency(getSellTransactionTotal()) }}</div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeSellDialog" class="cancel-btn">Отмена</button>
          <button 
            @click="executeSell" 
            :disabled="!canSell"
            class="confirm-btn"
          >
            Продать
          </button>
        </div>
      </div>
    </div>

    <!-- Диалог графика -->
    <div v-if="showChartDialog" class="modal chart-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>График акции {{ selectedStock?.symbol }}</h3>
          <button @click="closeChartDialog">×</button>
        </div>
        <div class="modal-body">
          <div class="chart-info">
            <div><strong>Акция:</strong> {{ selectedStock?.name }}</div>
            <div><strong>Текущая цена:</strong> ${{ brokerStore.formatCurrency(getStockCurrentPrice(selectedStock?.symbol)) }}</div>
            <div><strong>История изменения цен:</strong></div>
          </div>
          <div class="chart-container">
            <div class="full-chart">
              <div class="chart-header">
                <div class="chart-title">График изменения цены акции {{ selectedStock?.symbol }}</div>
                <div class="chart-period">
                  <span>Период: {{ getChartPeriod() }}</span>
                  <button @click="resetStockChart(selectedStock?.symbol)" class="reset-stock-chart-btn" title="Сбросить график этой акции">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.1-6.3M22 12.5a10 10 0 0 1-18.1 6.2"/>
                    </svg>
                    Сбросить
                  </button>
                </div>
              </div>
              <div class="chart-content">
                <div v-if="getChartHistoryForStock(selectedStock?.symbol).length === 0" class="no-data">
                  Нет данных для отображения. Цена этой акции еще не обновлялась.
                </div>
                <div v-else class="chart-svg-container">
                  <svg :width="fullChartWidth" :height="fullChartHeight" class="full-chart-svg">
                    <!-- Сетка -->
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)"/>
                    
                    <!-- Линия графика -->
                    <path 
                      :d="getFullChartPath(selectedStock?.symbol)" 
                      fill="none" 
                      stroke="#3498db" 
                      stroke-width="3"
                      class="chart-line"
                    />
                    
                    <!-- Точки на графике -->
                    <g v-for="(point, index) in getChartPoints(selectedStock?.symbol)" :key="index">
                      <circle 
                        :cx="point.x" 
                        :cy="point.y" 
                        r="4" 
                        fill="#3498db"
                        stroke="white"
                        stroke-width="2"
                        class="chart-point"
                        @mouseover="showTooltip($event, point)"
                        @mouseleave="hideTooltip"
                      />
                      
                      <!-- Подписи к точкам (каждой 3-й) -->
                      <text 
                        v-if="index % 3 === 0 || index === getChartPoints(selectedStock?.symbol).length - 1"
                        :x="point.x" 
                        :y="fullChartHeight - 10" 
                        text-anchor="middle"
                        class="chart-label"
                        fill="#7f8c8d"
                        font-size="12"
                      >
                        {{ formatChartDateShort(getChartHistoryForStock(selectedStock?.symbol)[index]?.date) }}
                      </text>
                    </g>
                    
                    <!-- Ценовые метки -->
                    <text 
                      v-for="(price, index) in getPriceLabels(selectedStock?.symbol)" 
                      :key="'price-' + index"
                      x="10" 
                      :y="price.y" 
                      text-anchor="start"
                      class="price-label"
                      fill="#7f8c8d"
                      font-size="12"
                    >
                      ${{ price.value }}
                    </text>
                    
                    <!-- Всплывающая подсказка -->
                    <foreignObject 
                      v-if="tooltip.visible" 
                      :x="tooltip.x" 
                      :y="tooltip.y"
                      width="200" 
                      height="60"
                    >
                      <div class="tooltip-content">
                        <div class="tooltip-date"><strong>Дата:</strong> {{ tooltip.date }}</div>
                        <div class="tooltip-price"><strong>Цена:</strong> ${{ tooltip.price }}</div>
                      </div>
                    </foreignObject>
                  </svg>
                </div>
              </div>
              <div class="chart-stats">
                <div class="stat-item" :class="getFullPriceChangeClass(selectedStock?.symbol)">
                  <span>Изменение за период:</span>
                  <span>{{ getFullPriceChangeText(selectedStock?.symbol) }}</span>
                </div>
                <div v-if="selectedStock?.purchasePrice" class="stat-item" :class="getStockProfitClass(selectedStock)">
                  <span>Ваша прибыль/убыток:</span>
                  <span>${{ brokerStore.formatCurrency(getStockProfit(selectedStock)) }} ({{ getStockProfitPercent(selectedStock) }}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeChartDialog" class="close-btn">Закрыть</button>
        </div>
      </div>
    </div>

    <div class="footer">
      <button @click="logout" class="logout-btn">Выйти</button>
    </div>
  </div>
</template>

<script setup>

import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBrokerStore } from '../stores/broker'
import { brokerService } from '../services/brokerService'

const router = useRouter()
const brokerStore = useBrokerStore()

const loading = ref(false)
const error = ref('')

const showBuyDialog = ref(false)
const showSellDialog = ref(false)
const showChartDialog = ref(false)
const selectedStock = ref(null)
const buyQuantity = ref(1)
const sellQuantity = ref(1)

const stockPriceHistory = ref({})
const allPriceUpdates = ref([])

const initialPrices = ref({})

const profitCache = ref({})

const chartWidth = 280
const chartHeight = 80
const fullChartWidth = 720
const fullChartHeight = 400

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  date: '',
  price: ''
})

const currentDate = computed(() => {
  return brokerStore.tradingState.currentDate || new Date().toLocaleDateString('ru-RU')
})

const tradingStocks = computed(() => {
  if (!brokerStore.tradingState.stockPrices) {
    return []
  }
  
  const tradingSymbols = Object.keys(brokerStore.tradingState.stockPrices)
  
  return brokerStore.enabledStocks.filter(stock => 
    tradingSymbols.includes(stock.symbol)
  )
})

const canBuy = computed(() => {
  return buyQuantity.value > 0 && 
         getTransactionTotal() <= brokerStore.balance &&
         buyQuantity.value <= getMaxBuyQuantity()
})

const canSell = computed(() => {
  return sellQuantity.value > 0 && 
         sellQuantity.value <= selectedStock.value?.quantity
})

// Следим за изменениями цен и обновляем кэш прибыли
watch(() => brokerStore.tradingState.stockPrices, (newPrices) => {
  if (newPrices) {
    // Сбрасываем кэш при обновлении цен
    profitCache.value = {}
    
    // Обновляем начальные цены для новых акций
    Object.keys(newPrices).forEach(symbol => {
      if (!initialPrices.value[symbol] && newPrices[symbol] > 0) {
        initialPrices.value[symbol] = newPrices[symbol]
      }
    })
  }
}, { deep: true })

// Следим за изменениями портфеля
watch(() => brokerStore.portfolioStocks, (newPortfolio) => {
  // При изменении портфеля сбрасываем кэш
  profitCache.value = {}
}, { deep: true })

function getStockCurrentPrice(symbol) {
  if (brokerStore.tradingState.stockPrices && brokerStore.tradingState.stockPrices[symbol]) {
    return brokerStore.tradingState.stockPrices[symbol]
  }
  
  const stock = brokerStore.availableStocks.find(s => s.symbol === symbol)
  console.log(symbol, stock);
  return stock ? stock.currentPrice : 0
}

function getStockProfit(stock) {
  if (!stock) return 0
  
  const cacheKey = `${stock.symbol}_${stock.quantity}_${stock.purchasePrice || 0}`
  
  if (profitCache.value[cacheKey] !== undefined) {
    return profitCache.value[cacheKey]
  }
  
  const currentPrice = getStockCurrentPrice(stock.symbol)
  if (stock.purchasePrice) {
    const profit = (currentPrice - stock.purchasePrice) * stock.quantity
    profitCache.value[cacheKey] = profit
    return profit
  }
  
  if (initialPrices.value[stock.symbol]) {
    const profit = (currentPrice - initialPrices.value[stock.symbol]) * stock.quantity
    profitCache.value[cacheKey] = profit
    return profit
  }
  
  profitCache.value[cacheKey] = 0
  return 0
}

function getStockProfitPercent(stock) {
  if (!stock) return '0.00'
  
  const cacheKey = `${stock.symbol}_percent_${stock.purchasePrice || 0}`
  
  // Проверяем кэш
  if (profitCache.value[cacheKey] !== undefined) {
    return profitCache.value[cacheKey]
  }
  
  const currentPrice = getStockCurrentPrice(stock.symbol)
  
  // Если есть цена покупки, используем её
  if (stock.purchasePrice && stock.purchasePrice > 0) {
    const percent = ((currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100
    const result = percent.toFixed(2)
    profitCache.value[cacheKey] = result
    return result
  }
  
  // Если нет цены покупки, используем начальную цену
  if (initialPrices.value[stock.symbol] && initialPrices.value[stock.symbol] > 0) {
    const percent = ((currentPrice - initialPrices.value[stock.symbol]) / initialPrices.value[stock.symbol]) * 100
    const result = percent.toFixed(2)
    profitCache.value[cacheKey] = result
    return result
  }
  
  profitCache.value[cacheKey] = '0.00'
  return '0.00'
}

function getStockProfitClass(stock) {
  const profit = getStockProfit(stock)
  return profit >= 0 ? 'profit-positive' : 'profit-negative'
}

function getChartColor(stock) {
  const profit = getStockProfit(stock)
  return profit >= 0 ? '#2ecc71' : '#e74c3c'
}

// Функции для мини-графиков
function getChartHistoryForStock(symbol) {
  return stockPriceHistory.value[symbol] || []
}

function getChartPath(symbol) {
  const history = getChartHistoryForStock(symbol)
  if (history.length < 2) return ''
  
  const prices = history.map(item => item.price)
  const maxPrice = Math.max(...prices)
  const minPrice = Math.min(...prices)
  const range = maxPrice - minPrice || 1
  
  const padding = 10
  const effectiveHeight = chartHeight - padding * 2
  const effectiveWidth = chartWidth - padding * 2
  
  let path = `M ${padding} `
  const firstPrice = ((maxPrice - prices[0]) / range) * effectiveHeight + padding
  path += firstPrice
  
  for (let i = 1; i < prices.length; i++) {
    const x = padding + (i / (prices.length - 1)) * effectiveWidth
    const y = ((maxPrice - prices[i]) / range) * effectiveHeight + padding
    path += ` L ${x} ${y}`
  }
  
  return path
}

function getLastPointX(symbol) {
  const history = getChartHistoryForStock(symbol)
  if (history.length < 1) return 0
  
  const padding = 10
  const effectiveWidth = chartWidth - padding * 2
  const lastIndex = history.length - 1
  return padding + (lastIndex / Math.max(history.length - 1, 1)) * effectiveWidth
}

function getLastPointY(symbol) {
  const history = getChartHistoryForStock(symbol)
  if (history.length < 1) return 0
  
  const prices = history.map(item => item.price)
  const maxPrice = Math.max(...prices)
  const minPrice = Math.min(...prices)
  const range = maxPrice - minPrice || 1
  
  const padding = 10
  const effectiveHeight = chartHeight - padding * 2
  const lastPrice = prices[prices.length - 1]
  return ((maxPrice - lastPrice) / range) * effectiveHeight + padding
}

function getPriceChangeText(symbol) {
  const history = getChartHistoryForStock(symbol)
  if (history.length < 2) return '—'
  
  const firstPrice = history[0].price
  const lastPrice = history[history.length - 1].price
  const change = lastPrice - firstPrice
  const percent = (change / firstPrice) * 100
  
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(1)}%)`
}

function getPriceChangeClassForStock(symbol) {
  const history = getChartHistoryForStock(symbol)
  if (history.length < 2) return ''
  
  const firstPrice = history[0].price
  const lastPrice = history[history.length - 1].price
  const change = lastPrice - firstPrice
  
  return change >= 0 ? 'price-up' : 'price-down'
}

// Функции для полного графика в диалоге
function getChartPoints(symbol) {
  const history = getChartHistoryForStock(symbol)
  if (history.length < 1) return []
  
  const prices = history.map(item => item.price)
  const maxPrice = Math.max(...prices)
  const minPrice = Math.min(...prices)
  const range = maxPrice - minPrice || 1
  
  const padding = { top: 40, right: 40, bottom: 60, left: 60 }
  const effectiveHeight = fullChartHeight - padding.top - padding.bottom
  const effectiveWidth = fullChartWidth - padding.left - padding.right
  
  return history.map((item, index) => {
    const x = padding.left + (index / Math.max(history.length - 1, 1)) * effectiveWidth
    const y = padding.top + ((maxPrice - item.price) / range) * effectiveHeight
    return { x, y, date: item.date, price: item.price }
  })
}
function getProfileProfitClass(){
  brokerStore.getPortfolioValue();
  if(brokerStore.getInitBalance() > brokerService.getPortfolioValue){
    return 'profile-negative';
  }
  else{
    return 'profile-positive';
  }
}
function getFullChartPath(symbol) {
  const points = getChartPoints(symbol)
  if (points.length < 2) return ''
  
  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`
  }
  
  return path
}

function getPriceLabels(symbol) {
  const history = getChartHistoryForStock(symbol)
  if (history.length === 0) return []
  
  const prices = history.map(item => item.price)
  const maxPrice = Math.max(...prices)
  const minPrice = Math.min(...prices)
  
  const steps = 5
  const padding = { top: 40, bottom: 60 }
  const effectiveHeight = fullChartHeight - padding.top - padding.bottom
  
  const labels = []
  for (let i = 0; i <= steps; i++) {
    const value = maxPrice - (i / steps) * (maxPrice - minPrice)
    labels.push({
      y: padding.top + (i / steps) * effectiveHeight,
      value: value.toFixed(2)
    })
  }
  
  return labels
}

function getChartPeriod() {
  const history = getChartHistoryForStock(selectedStock.value?.symbol)
  if (history.length < 2) return 'Нет данных'
  
  const firstDate = new Date(history[0].date)
  const lastDate = new Date(history[history.length - 1].date)
  
  return `${firstDate.toLocaleDateString('ru-RU')} - ${lastDate.toLocaleDateString('ru-RU')}`
}

function getFullPriceChangeText(symbol) {
  const history = getChartHistoryForStock(symbol)
  if (history.length < 2) return '—'
  
  const firstPrice = history[0].price
  const lastPrice = history[history.length - 1].price
  const change = lastPrice - firstPrice
  const percent = (change / firstPrice) * 100
  
  const sign = change >= 0 ? '+' : ''
  return `${sign}$${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`
}

function getFullPriceChangeClass(symbol) {
  const history = getChartHistoryForStock(symbol)
  if (history.length < 2) return ''
  
  const firstPrice = history[0].price
  const lastPrice = history[history.length - 1].price
  const change = lastPrice - firstPrice
  
  return change >= 0 ? 'price-up' : 'price-down'
}

function formatChartDateShort(dateStr) {
  if (!dateStr) return ''
  
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).slice(0, 5)
  } catch (e) {
    return dateStr.substring(0, 5)
  }
}

function showTooltip(event, point) {
  tooltip.value = {
    visible: true,
    x: point.x + 10,
    y: point.y - 70,
    date: point.date,
    price: point.price.toFixed(2)
  }
}

function hideTooltip() {
  tooltip.value.visible = false
}

// Функции для сброса графиков
function resetStockChart(symbol) {
  if (!symbol) return
  
  // Очищаем историю для конкретной акции
  stockPriceHistory.value[symbol] = []
  
  // Удаляем начальную цену
  delete initialPrices.value[symbol]
  
  // Сбрасываем кэш для этой акции
  Object.keys(profitCache.value).forEach(key => {
    if (key.startsWith(symbol)) {
      delete profitCache.value[key]
    }
  })
  
  // Если это открытый диалог, закрываем его
  if (showChartDialog.value && selectedStock.value?.symbol === symbol) {
    closeChartDialog()
  }
}

function resetAllCharts() {
  // Подтверждение действия
  if (!confirm('Вы уверены, что хотите сбросить все графики? История цен будет очищена.')) {
    return
  }
  
  // Очищаем всю историю
  stockPriceHistory.value = {}
  initialPrices.value = {}
  allPriceUpdates.value = []
  profitCache.value = {}
  
  // Закрываем диалог графика, если открыт
  if (showChartDialog.value) {
    closeChartDialog()
  }
  
  // Показываем уведомление
  error.value = 'Все графики сброшены. Данные начнут накапливаться заново.'
  setTimeout(() => {
    error.value = ''
  }, 3000)
}

async function loadDashboardData() {
  try {
    loading.value = true
    error.value = ''

    // Загружаем данные брокера
    await brokerStore.loadBrokerData()
    
    // Инициализируем начальные цены для расчета прибыли
    initializeInitialPrices()
    
    // Настраиваем WebSocket соединение
    setupWebSocket()

  } catch (err) {
    error.value = 'Ошибка загрузки данных'
    console.error('Load dashboard error:', err)
  } finally {
    loading.value = false
  }
}

function initializeInitialPrices() {
  // Для акций в портфеле используем цену покупки как начальную
  brokerStore.enabledPortfolioStocks.forEach(stock => {
    if (stock.purchasePrice) {
      initialPrices.value[stock.symbol] = stock.purchasePrice
    }
  })
  
  // Для остальных акций используем текущую цену как начальную
  brokerStore.enabledStocks.forEach(stock => {
    if (!initialPrices.value[stock.symbol]) {
      const currentPrice = getStockCurrentPrice(stock.symbol)
      if (currentPrice > 0) {
        initialPrices.value[stock.symbol] = currentPrice
      }
    }
  })
  
  // Сбрасываем кэш при инициализации
  profitCache.value = {}
}

function setupWebSocket() {
  brokerService.connectWebSocket(
    // Обработчик получения всех акций
    (stocksData) => {
      console.log('Received all stocks data:', stocksData)
      brokerStore.setAvailableStocks(stocksData)
    },
    
    // Обработчик состояния торгов
    (tradingState) => {
      console.log('Received trading state:', tradingState)
      brokerStore.setTradingState(tradingState)
    },
    
    // Обработчик обновления цен
    (priceData) => {
      console.log('Received price update:', priceData)
      
      allPriceUpdates.value.push({
        date: priceData.date || new Date().toLocaleDateString('ru-RU'),
        prices: priceData.prices,
        timestamp: new Date().toISOString()
      })
      
      brokerStore.updateStockPrices(priceData)
      
      if (priceData.prices) {
        Object.entries(priceData.prices).forEach(([symbol, price]) => {
          if (!stockPriceHistory.value[symbol]) {
            stockPriceHistory.value[symbol] = []
          }
          
          // Запоминаем начальную цену, если ее еще нет
          if (!initialPrices.value[symbol] && price > 0) {
            initialPrices.value[symbol] = price
          }
          
          const lastEntry = stockPriceHistory.value[symbol][stockPriceHistory.value[symbol].length - 1]
          if (!lastEntry || lastEntry.price !== price) {
            stockPriceHistory.value[symbol].push({
              date: priceData.date || new Date().toLocaleDateString('ru-RU'),
              price: price,
              timestamp: new Date().toISOString()
            })
            
            // Ограничиваем историю последними 50 значениями
            if (stockPriceHistory.value[symbol].length > 50) {
              stockPriceHistory.value[symbol] = stockPriceHistory.value[symbol].slice(-50)
            }
            
            // Сбрасываем кэш прибыли для этой акции при обновлении цены
            Object.keys(profitCache.value).forEach(key => {
              if (key.startsWith(symbol)) {
                delete profitCache.value[key]
              }
            })
          }
        })
      }
    }
  )
}

// Диалог покупки
function openBuyDialog(stock) {
  selectedStock.value = stock
  buyQuantity.value = 1
  showBuyDialog.value = true
}

function closeBuyDialog() {
  showBuyDialog.value = false
  selectedStock.value = null
  buyQuantity.value = 1
}

function validateBuyQuantity() {
  const max = getMaxBuyQuantity()
  if (buyQuantity.value > max) {
    buyQuantity.value = max
  }
  if (buyQuantity.value < 1) {
    buyQuantity.value = 1
  }
}

function getMaxBuyQuantity() {
  if (!selectedStock.value) return 0
  const price = getStockCurrentPrice(selectedStock.value.symbol)
  if (price <= 0) return 0
  return Math.floor(brokerStore.balance / price)
}

function getTransactionTotal() {
  if (!selectedStock.value || !buyQuantity.value) return 0
  const price = getStockCurrentPrice(selectedStock.value.symbol)
  return price * buyQuantity.value
}

async function executeBuy() {
  if (!canBuy.value || !selectedStock.value) return

  try {
    loading.value = true
    error.value = ''
    
    await brokerStore.buyStock(selectedStock.value.symbol, parseInt(buyQuantity.value))
    
    // Сбрасываем кэш прибыли после покупки
    Object.keys(profitCache.value).forEach(key => {
      if (key.startsWith(selectedStock.value.symbol)) {
        delete profitCache.value[key]
      }
    })
    
    await loadDashboardData()
    closeBuyDialog()
    
  } catch (err) {
    error.value = err.response?.data?.message || 'Ошибка при покупке'
    console.error('Execute buy error:', err)
  } finally {
    loading.value = false
  }
}

// Диалог продажи
function openSellDialog(stock) {
  selectedStock.value = stock
  sellQuantity.value = 1
  showSellDialog.value = true
}

function closeSellDialog() {
  showSellDialog.value = false
  selectedStock.value = null
  sellQuantity.value = 1
}

function validateSellQuantity() {
  if (!selectedStock.value) return
  
  if (sellQuantity.value > selectedStock.value.quantity) {
    sellQuantity.value = selectedStock.value.quantity
  }
  if (sellQuantity.value < 1) {
    sellQuantity.value = 1
  }
}

function getSellTransactionTotal() {
  if (!selectedStock.value || !sellQuantity.value) return 0
  const currentPrice = getStockCurrentPrice(selectedStock.value.symbol)
  return currentPrice * sellQuantity.value
}

async function executeSell() {
  if (!canSell.value || !selectedStock.value) return

  try {
    loading.value = true
    error.value = ''
    
    await brokerStore.sellStock(selectedStock.value.symbol, parseInt(sellQuantity.value))
    
    // Сбрасываем кэш прибыли после продажи
    Object.keys(profitCache.value).forEach(key => {
      if (key.startsWith(selectedStock.value.symbol)) {
        delete profitCache.value[key]
      }
    })
    
    await loadDashboardData()
    closeSellDialog()
    
  } catch (err) {
    error.value = err.response?.data?.message || 'Ошибка при продаже'
    console.error('Execute sell error:', err)
  } finally {
    loading.value = false
  }
}

// Диалог графика
function openChartDialog(stock) {
  selectedStock.value = stock
  showChartDialog.value = true
}

function closeChartDialog() {
  showChartDialog.value = false
  selectedStock.value = null
  tooltip.value.visible = false
}

function logout() {
  brokerService.disconnectWebSocket()
  brokerStore.logout()
  router.push('/')
}

function clearError() {
  error.value = ''
}

onMounted(() => {
  if (!brokerService.isAuthenticated()) {
    router.push('/')
    return
  }
  loadDashboardData()
})

onUnmounted(() => {
  brokerService.disconnectWebSocket()
})

</script>

<style scoped>
.dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.header h1 {
  color: #2c3e50;
  margin: 0 0 15px 0;
  font-size: 2em;
}

.current-date {
  background: #3498db;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 1.1em;
  margin-bottom: 20px;
}

.current-date strong {
  font-weight: 600;
}

.error {
  background: #e74c3c;
  color: white;
  padding: 10px 15px;
  border-radius: 5px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error button {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 5px;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.info-panel {
  background: #2c3e50;
  color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  text-align: center;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.funds {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
}

.funds span:first-child {
  font-size: 1.1em;
  opacity: 0.9;
}

.amount {
  font-size: 2em;
  font-weight: 700;
  color: #2ecc71;
}

.reset-charts-btn {
  background: #e67e22;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 600;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.reset-charts-btn:hover {
  background: #d35400;
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(230, 126, 34, 0.3);
}

.reset-charts-btn svg {
  stroke: white;
}

.content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

@media (max-width: 900px) {
  .content {
    grid-template-columns: 1fr;
  }
  
  .info-panel {
    flex-direction: column;
    text-align: center;
  }
  
  .funds {
    align-items: center;
  }
}

.panel {
  background: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 1px solid #e1e8ed;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #3498db;
}

.panel h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5em;
}

.stocks-count, .portfolio-value {
  background: #3498db;
  color: white;
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 0.95em;
  font-weight: 600;
}

.stocks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.stock-card {
  background: #f8f9fa;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
}

.stock-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0,0,0,0.1);
  border-color: #3498db;
}

.stock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ddd;
}

.symbol {
  font-weight: 700;
  color: #000000;
  font-size: 1.3em;
}

.price {
  font-weight: 700;
  color: #000000;
  font-size: 1.3em;
}

.name {
  color: #000000;
  font-size: 1em;
  margin-bottom: 15px;
  font-style: italic;
}

.details {
  font-size: 0.95em;
  color: #000000;
  margin-bottom: 15px;
  background: white;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e1e8ed;
}

.details div {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
}

.details div:last-child {
  margin-bottom: 0;
}

.profit-positive {
  color: #2ecc71;
  font-weight: 600;
}

.profit-negative {
  color: #e74c3c;
  font-weight: 600;
}

.profit-percent {
  font-size: 0.9em;
  opacity: 0.8;
}

/* Стили для мини-графиков */
.mini-chart-container {
  margin: 15px 0;
  background: white;
  border-radius: 6px;
  padding: 10px;
  border: 1px solid #e1e8ed;
}

.mini-chart {
  position: relative;
  height: 80px;
  margin-bottom: 8px;
}

.chart-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.no-chart-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #95a5a6;
  font-size: 0.9em;
  font-style: italic;
}

.chart-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9em;
}

.change-indicator {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f8f9fa;
}

.price-up {
  color: #2ecc71;
}

.price-down {
  color: #e74c3c;
}

.purchase-price {
  color: #7f8c8d;
  font-size: 0.85em;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.actions button {
  padding: 10px 15px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 600;
  flex: 1;
  transition: all 0.3s;
  text-align: center;
  color: white;
}

.actions button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0,0,0,0.2);
}

.actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.buy-btn {
  background: #2ecc71;
}

.sell-btn {
  background: #e74c3c;
}

.chart-btn {
  background: #3498db;
}

.empty {
  text-align: center;
  color: #000000;
  padding: 60px 20px;
  grid-column: 1 / -1;
  font-size: 1.1em;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #ddd;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(3px);
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.chart-modal .modal-content {
  max-width: 800px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 2px solid #e1e8ed;
  background: #2c3e50;
  color: white;
  border-radius: 12px 12px 0 0;
}

.modal-header h3 {
  margin: 0;
  color: white;
  font-size: 1.4em;
}

.modal-header button {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: white;
  padding: 0;
  width: auto;
  line-height: 1;
}

.modal-body {
  padding: 25px;
}

.info, .summary {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #e1e8ed;
  color: #000000;
}

.info div, .summary div {
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
}

.info div:last-child, .summary div:last-child {
  margin-bottom: 0;
}

.input-group {
  margin-bottom: 25px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #000000;
  font-size: 1.05em;
}

.input-group input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1.1em;
  transition: border-color 0.3s;
  color: #000000;
}

.input-group input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

.modal-actions {
  display: flex;
  gap: 15px;
  padding: 20px 25px;
  border-top: 2px solid #e1e8ed;
  background: #f8f9fa;
  border-radius: 0 0 12px 12px;
}

.modal-actions button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.05em;
  font-weight: 600;
  transition: all 0.3s;
  color: white;
}

.modal-actions button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0,0,0,0.2);
}

.modal-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  background: #95a5a6;
}

.confirm-btn {
  background: #2ecc71;
}

.close-btn {
  background: #3498db;
}

/* Стили для полного графика */
.full-chart {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e1e8ed;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e1e8ed;
}

.chart-title {
  font-size: 1.2em;
  font-weight: 600;
  color: #2c3e50;
}

.chart-period {
  color: #7f8c8d;
  font-size: 0.9em;
  display: flex;
  align-items: center;
  gap: 10px;
}

.reset-stock-chart-btn {
  background: #e67e22;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8em;
  font-weight: 600;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.reset-stock-chart-btn:hover {
  background: #d35400;
}

.reset-stock-chart-btn svg {
  stroke: white;
}

.chart-svg-container {
  width: 100%;
  height: 400px;
  position: relative;
}

.full-chart-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.chart-line {
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.chart-point {
  cursor: pointer;
  transition: all 0.2s ease;
}

.chart-point:hover {
  r: 6;
  fill: #2980b9;
  filter: drop-shadow(0 0 4px rgba(41, 128, 185, 0.5));
}

.chart-label {
  font-size: 11px;
  fill: #7f8c8d;
}

.price-label {
  font-size: 11px;
  fill: #7f8c8d;
}

/* Всплывающая подсказка */
.tooltip-content {
  background: rgba(44, 62, 80, 0.95);
  color: white;
  padding: 10px;
  border-radius: 6px;
  font-size: 12px;
  box-shadow: 0 3px 10px rgba(0,0,0,0.2);
  border: 1px solid #2c3e50;
}

.tooltip-date {
  margin-bottom: 5px;
  color: #ecf0f1;
}

.tooltip-price {
  font-size: 14px;
  font-weight: 600;
  color: #2ecc71;
}

.chart-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e1e8ed;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 0.9em;
}

.stat-item span:first-child {
  color: #7f8c8d;
}

.stat-item span:last-child {
  font-weight: 600;
}

.price-up {
  color: #2ecc71;
}

.price-down {
  color: #e74c3c;
}

.footer {
  text-align: center;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 2px solid #e1e8ed;
}

.logout-btn {
  background: #e74c3c;
  color: white;
  padding: 12px 40px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1em;
  font-weight: 600;
  transition: all 0.3s;
}

.logout-btn:hover {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}
.profit-positive {
  color: #27ae60 !important; /* Более насыщенный зеленый */
  font-weight: 700;
  background: rgba(39, 174, 96, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  border-left: 3px solid #27ae60;
}

.profit-negative {
  color: #c0392b !important; /* Более насыщенный красный */
  font-weight: 700;
  background: rgba(192, 57, 43, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  border-left: 3px solid #c0392b;
}
.profile-positive {
  color: #27ae60 !important; /* Более насыщенный зеленый */
  font-weight: 700;
  background: rgba(39, 174, 96, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  border-left: 3px solid #27ae60;
}

.profile-negative {
  color: #c0392b !important; /* Более насыщенный красный */
  font-weight: 700;
  background: rgba(192, 57, 43, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  border-left: 3px solid #c0392b;
}

.price-up {
  color: #27ae60 !important;
  font-weight: 600;
}

.price-down {
  color: #c0392b !important;
  font-weight: 600;
}

/* Улучшаем отображение процентов прибыли */
.profit-percent {
  font-size: 0.85em;
  font-weight: 600;
  opacity: 0.9;
}

.profit-positive .profit-percent {
  color: #1e8449;
}

.profit-negative .profit-percent {
  color: #a93226;
}

.info .profit-positive,
.info .profit-negative,
.summary .profit-positive,
.summary .profit-negative {
  margin-top: 8px;
  padding: 6px 10px;
}

.chart-stats .stat-item.profit-positive {
  color: #27ae60;
  background: rgba(39, 174, 96, 0.1);
  border-left: 3px solid #27ae60;
}

.chart-stats .stat-item.profit-negative {
  color: #c0392b;
  background: rgba(192, 57, 43, 0.1);
  border-left: 3px solid #c0392b;
}

.profit-positive, .profit-negative {
  transition: all 0.3s ease;
}

.profit-positive:hover {
  background: rgba(39, 174, 96, 0.15);
}

.profit-negative:hover {
  background: rgba(192, 57, 43, 0.15);
}
</style>