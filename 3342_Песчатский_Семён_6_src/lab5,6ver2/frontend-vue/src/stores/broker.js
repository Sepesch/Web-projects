import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { brokerService } from '../services/brokerService'

export const useBrokerStore = defineStore('broker', () => {
  const currentBroker = ref(null)
  const balance = ref(0)
  const initBalance = ref(0)
  const stocks = ref([]) // Все акции брокера (включая disabled)
  const availableStocks = ref([]) // Все акции с сервера
  const enabledStocks = ref([]) // Только enabled акции
  const tradingState = ref({
    isTrading: false,
    currentDate: '',
    stockPrices: {},
    currentDateIndex: 0
  })

  // Акции в портфеле, которые enabled: true
  const enabledPortfolioStocks = computed(() => {
    return stocks.value.filter(stock => {
      const availableStock = availableStocks.value.find(s => s.symbol === stock.symbol)
      // Показываем только если акция найдена в availableStocks и enabled: true
      return availableStock && availableStock.enabled === true
    })
  })

  const totalBalance = computed(() => {
    const stocksValue = enabledPortfolioStocks.value.reduce((total, stock) => {
      const currentPrice = getStockCurrentPrice(stock.symbol)
      return total + (currentPrice * stock.quantity)
    }, 0)
    return balance.value + stocksValue
  })

  const tradingStatusText = computed(() => {
    return tradingState.value.isTrading ? 'Торги активны' : 'Торги остановлены'
  })

  const tradingStatusClass = computed(() => {
    return tradingState.value.isTrading ? 'status-active' : 'status-inactive'
  })

  // Загрузка всех данных брокера
  async function loadBrokerData() {
    try {
      if (!brokerService.isAuthenticated()) {
        throw new Error('Not authenticated')
      }

      // Загружаем информацию о брокере
      const brokerInfo = await brokerService.getBrokerInfo()
      
      currentBroker.value = brokerInfo.data
      balance.value = brokerInfo.data.currentFunds

      // Загружаем все акции с сервера (с флагом enabled)
      await loadAvailableStocks()

      // Получаем акции брокера из ответа
      const brokerStocks = brokerInfo.data.stocks || {}
      
      // Преобразуем в массив объектов
      stocks.value = Object.entries(brokerStocks).map(([symbol, quantity]) => {
        const stockInfo = availableStocks.value.find(s => s.symbol === symbol)
        return {
          id: symbol,
          symbol: symbol,
          quantity: quantity,
          purchasePrice: stockInfo?.purchasePrice || stockInfo?.currentPrice || 0,
          currentPrice: getStockCurrentPrice(symbol)
        }
      })

    } catch (error) {
      console.error('Error loading broker data:', error)
      throw error
    }
  }


  // Восстановление сессии
  async function restoreSession() {
    if (brokerService.isAuthenticated()) {
      try {
        await loadBrokerData()
        return true
      } catch (error) {
        console.error('Session restore failed:', error)
        brokerService.logout()
        return false
      }
    }
    return false
  }

  // Выход из системы
  function logout() {
    brokerService.logout()
    currentBroker.value = null
    balance.value = 0
    stocks.value = []
    availableStocks.value = []
    enabledStocks.value = []
    tradingState.value = {
      isTrading: false,
      currentDate: '',
      stockPrices: {},
      currentDateIndex: 0
    }
  }

  function getStockCurrentPrice(symbol) {
    if (tradingState.value.stockPrices && tradingState.value.stockPrices[symbol]) {
      return tradingState.value.stockPrices[symbol]
    }
    
    // Затем проверяем в availableStocks
    const stock = availableStocks.value.find(s => s.symbol === symbol)
    return stock ? stock.currentPrice : 0
  }

  function getStockInfo(symbol) {
    return availableStocks.value.find(s => s.symbol === symbol)
  }

  function isStockEnabled(symbol) {
    const stock = availableStocks.value.find(s => s.symbol === symbol)
    return stock ? stock.enabled === true : false
  }

  // Расчет прибыли по акции
  function getStockProfit(stock) {
    if (!stock) return 0
    const currentPrice = getStockCurrentPrice(stock.symbol)
    return (currentPrice - stock.purchasePrice) * stock.quantity
  }

  function getStockProfitPercent(stock) {
    if (!stock || stock.purchasePrice === 0) return 0
    const currentPrice = getStockCurrentPrice(stock.symbol)
    return ((currentPrice - stock.purchasePrice) / stock.purchasePrice) * 100
  }

  function getStockProfitClass(stock) {
    const profit = getStockProfit(stock)
    return profit >= 0 ? 'profit-positive' : 'profit-negative'
  }

  async function buyStock(stockId, quantity) {
    try {
      if (!isStockEnabled(stockId)) {
        throw new Error(`Акция ${stockId} отключена и не может быть куплена`)
      }

      const result = await brokerService.buyStock(stockId, quantity)
      await loadBrokerData()
      return result
    } catch (error) {
      console.error('Buy stock error:', error)
      throw error
    }
  }

  async function sellStock(stockId, quantity) {
    try {
      const result = await brokerService.sellStock(stockId, quantity)
      await loadBrokerData()
      return result
    } catch (error) {
      console.error('Sell stock error:', error)
      throw error
    }
  }

  function setAvailableStocks(stocksData) {
    availableStocks.value = stocksData.map(stock => ({
      id: stock.symbol,
      symbol: stock.symbol,
      name: stock.name,
      currentPrice: stock.currentPrice || 0,
      enabled: stock.enabled || true
    }))

    enabledStocks.value = availableStocks.value.filter(stock => stock.enabled === true)
  }

  function setTradingState(newState) {
    tradingState.value = {
      ...tradingState.value,
      ...newState
    }
  }

  function updateStockPrices(priceData) {
    if (priceData.prices) {
      Object.entries(priceData.prices).forEach(([symbol, price]) => {
        const stockIndex = availableStocks.value.findIndex(s => s.symbol === symbol)
        if (stockIndex !== -1) {
          availableStocks.value[stockIndex].currentPrice = price
        }

        // Обновляем в tradingState
        tradingState.value.stockPrices[symbol] = price
      })
    }

    if (priceData.date) {
      tradingState.value.currentDate = priceData.date
    }
    if (priceData.dateIndex !== undefined) {
      tradingState.value.currentDateIndex = priceData.dateIndex
    }
  }

  function getInitBalance(){
    return initBalance;
  }
  function getPortfolioValue() {
    if(initBalance === 0 ){initBalance = enabledPortfolioStocks.value.reduce((total, stock) => {
      const currentPrice = getStockCurrentPrice(stock.symbol)
      return total + (currentPrice * stock.quantity)
    }, 0)}
    return enabledPortfolioStocks.value.reduce((total, stock) => {
      const currentPrice = getStockCurrentPrice(stock.symbol)
      return total + (currentPrice * stock.quantity)
    }, 0)
  }

  // Форматирование валюты
  function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0.00'
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  // Управление торгами
  async function startTrading(tradingSettings) {
    try {
      return brokerService.startTrading(tradingSettings)
    } catch (error) {
      console.error('Start trading error:', error)
      throw error
    }
  }

  async function stopTrading() {
    try {
      return brokerService.stopTrading()
    } catch (error) {
      console.error('Stop trading error:', error)
      throw error
    }
  }
  async function loadAvailableStocks() {
    try {
      // Используем WebSocket для получения акций
      // Вместо прямого API запроса, ждем данные через WebSocket
      // brokerService уже получает акции через WebSocket и передает их в setAvailableStocks
      
      // Если нужно сделать HTTP запрос, можно добавить эндпоинт GET /api/stocks
      // const response = await axios.get(`${API_BASE}/stocks`)
      // availableStocks.value = response.data
      
    } catch (error) {
      console.error('Error loading available stocks:', error)
    }
  }
  return {
    currentBroker,
    balance,
    stocks,
    availableStocks,
    enabledStocks,
    enabledPortfolioStocks,
    tradingState,
    
    totalBalance,
    tradingStatusText,
    tradingStatusClass,
    
    loadBrokerData,
    restoreSession,
    logout,
    buyStock,
    sellStock,
    getStockCurrentPrice,
    getStockInfo,
    isStockEnabled,
    getStockProfit,
    getStockProfitPercent,
    getStockProfitClass,
    setAvailableStocks,
    setTradingState,
    updateStockPrices,
    getPortfolioValue,
    formatCurrency,
    startTrading,
    stopTrading,
    getInitBalance
  }
})