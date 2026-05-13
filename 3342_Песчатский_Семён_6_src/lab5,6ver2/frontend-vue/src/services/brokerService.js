import axios from 'axios'
import { io } from 'socket.io-client'

const API_BASE = 'http://localhost:3000/api'

class BrokerService {
  constructor() {
    this.socket = null
    this.currentPrices = {} // Кэш текущих цен акций из WebSocket
    this.priceUpdateCallbacks = [] // Коллбэки для обновления цен
  }

  getBrokerId() {
    return localStorage.getItem('brokerId')
  }

  async getBrokers() {
    return axios.get(`${API_BASE}/brokers`)
  }

  async getBalance() {
    const brokerId = this.getBrokerId()
    const response = await axios.get(`${API_BASE}/brokers/${brokerId}`)
    return { data: { currentFunds: response.data.currentFunds } }
  }

  async getStocks() {
    const brokerId = this.getBrokerId()
    const response = await axios.get(`${API_BASE}/brokers/${brokerId}`)
    return { data: { stocks: response.data.stocks || {} } }
  }

  async buyStock(stockId, quantity) {
    const brokerId = this.getBrokerId()
    
    try {
      const brokerResponse = await this.getBrokerInfo()
      const broker = brokerResponse.data
      
      // Получаем текущую цену акции из WebSocket кэша
      const stockPrice = this.getStockCurrentPrice(stockId)
      if (!stockPrice) {
        throw new Error(`Не удалось получить текущую цену акции ${stockId}`)
      }
      
      const totalCost = stockPrice * quantity
      
      // Проверяем, достаточно ли средств
      if (broker.currentFunds < totalCost) {
        throw new Error('Недостаточно средств для покупки')
      }
      
      // Обновляем портфель акций
      const currentStocks = broker.stocks || {}
      const currentQuantity = currentStocks[stockId] || 0
      
      const updatedStocks = {
        ...currentStocks,
        [stockId]: currentQuantity + quantity
      }
      
      // Обновляем баланс
      const updatedFunds = broker.currentFunds - totalCost
      
      // Отправляем запрос на обновление брокера
      return await this.updateBroker({
        currentFunds: updatedFunds,
        stocks: updatedStocks
      })
      
    } catch (error) {
      console.error('Buy stock error:', error)
      throw error
    }
  }

  async sellStock(stockId, quantity) {
    const brokerId = this.getBrokerId()
    
    try {
      // Получаем текущую информацию о брокере
      const brokerResponse = await this.getBrokerInfo()
      const broker = brokerResponse.data
      
      // Получаем текущую цену акции из WebSocket кэша
      const stockPrice = this.getStockCurrentPrice(stockId)
      if (!stockPrice) {
        throw new Error(`Не удалось получить текущую цену акции ${stockId}`)
      }
      
      const totalRevenue = stockPrice * quantity
      
      // Проверяем, есть ли достаточное количество акций
      const currentStocks = broker.stocks || {}
      const currentQuantity = currentStocks[stockId] || 0
      
      if (currentQuantity < quantity) {
        throw new Error(`Недостаточно акций для продажи. В наличии: ${currentQuantity}, запрошено: ${quantity}`)
      }
      
      // Обновляем портфель акций
      const updatedStocks = { ...currentStocks }
      
      if (currentQuantity === quantity) {
        // Удаляем акцию из портфеля, если продали все
        delete updatedStocks[stockId]
      } else {
        updatedStocks[stockId] = currentQuantity - quantity
      }
      
      // Обновляем баланс
      const updatedFunds = broker.currentFunds + totalRevenue
      
      // Отправляем запрос на обновление брокера
      return await this.updateBroker({
        currentFunds: updatedFunds,
        stocks: updatedStocks
      })
      
    } catch (error) {
      console.error('Sell stock error:', error)
      throw error
    }
  }

  // Метод для получения текущей цены акции
  getStockCurrentPrice(stockId) {
    // Возвращаем цену из кэша WebSocket
    return this.currentPrices[stockId] || null
  }

  // Метод для получения цен всех акций
  getAllStockPrices() {
    return { ...this.currentPrices }
  }

  // Регистрация коллбэка для обновления цен
  onPriceUpdate(callback) {
    this.priceUpdateCallbacks.push(callback)
  }

  // Удаление коллбэка
  offPriceUpdate(callback) {
    const index = this.priceUpdateCallbacks.indexOf(callback)
    if (index > -1) {
      this.priceUpdateCallbacks.splice(index, 1)
    }
  }

  async getBrokerInfo() {
    const brokerId = this.getBrokerId()
    return axios.get(`${API_BASE}/brokers/${brokerId}`)
  }

  async updateBroker(updates) {
    const brokerId = this.getBrokerId()
    return axios.put(`${API_BASE}/brokers/${brokerId}`, updates)
  }

  connectWebSocket(onStockData, onTradingState, onPriceUpdate) {
    try {
      this.socket = io('http://localhost:3000');
      
      this.socket.on('connect', () => {
        console.log('WebSocket connected to server')
        this.socket.emit('get_stocks')
        this.socket.emit('get_trading_state')
      })

      this.socket.on('stocks_data', (data) => {
        console.log('Received stocks data:', data)
        
        // Сохраняем начальные цены акций
        if (data.stocks && Array.isArray(data.stocks)) {
          data.stocks.forEach(stock => {
            if (stock.symbol && stock.currentPrice) {
              this.currentPrices[stock.symbol] = stock.currentPrice
            }
          })
        }
        
        if (onStockData && typeof onStockData === 'function') {
          onStockData(data.stocks)
        }
      })

      this.socket.on('trading_state', (data) => {
        console.log('Received trading state:', data)
        
        // Сохраняем цены из trading state
        if (data.stockPrices) {
          this.currentPrices = { ...this.currentPrices, ...data.stockPrices }
          
          // Вызываем коллбэки обновления цен
          this.priceUpdateCallbacks.forEach(callback => {
            try {
              callback(this.currentPrices)
            } catch (error) {
              console.error('Price update callback error:', error)
            }
          })
        }
        
        if (onTradingState && typeof onTradingState === 'function') {
          onTradingState(data)
        }
      })

      this.socket.on('price_update', (data) => {
        console.log('Price update received:', data)
        
        // Обновляем кэш цен
        if (data.prices) {
          this.currentPrices = { ...this.currentPrices, ...data.prices }
          
          // Вызываем коллбэки обновления цен
          this.priceUpdateCallbacks.forEach(callback => {
            try {
              callback(this.currentPrices)
            } catch (error) {
              console.error('Price update callback error:', error)
            }
          })
        }
        
        if (onPriceUpdate && typeof onPriceUpdate === 'function') {
          onPriceUpdate(data)
        }
      })

      this.socket.on('trading_started', (data) => {
        console.log('Trading started:', data)
        
        // Сохраняем начальные цены из trading started
        if (data.stockPrices) {
          this.currentPrices = { ...this.currentPrices, ...data.stockPrices }
          
          // Вызываем коллбэки обновления цен
          this.priceUpdateCallbacks.forEach(callback => {
            try {
              callback(this.currentPrices)
            } catch (error) {
              console.error('Price update callback error:', error)
            }
          })
        }
        
        if (onTradingState && typeof onTradingState === 'function') {
          onTradingState(data)
        }
      })

      this.socket.on('trading_stopped', (data) => {
        console.log('Trading stopped:', data)
        if (onTradingState && typeof onTradingState === 'function') {
          onTradingState(data)
        }
      })

      this.socket.on('connected', (data) => {
        console.log('Server connection confirmed:', data)
      })

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected')
      })

      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error)
      })

      this.socket.on('trading_error', (error) => {
        console.error('Trading error from server:', error)
      })

    } catch (error) {
      console.error('WebSocket setup error:', error)
    }
  }

  // Запросить акции у сервера
  requestStocks() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('get_stocks')
      return true
    }
    return false
  }

  // Запросить состояние торгов
  requestTradingState() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('get_trading_state')
      return true
    }
    return false
  }

  startTrading(tradingSettings) {
    if (this.socket && this.socket.connected) {
      console.log('Starting trading with settings:', tradingSettings)
      this.socket.emit('start_trading', tradingSettings)
      return true
    }
    return false
  }

  stopTrading() {
    if (this.socket && this.socket.connected) {
      console.log('Stopping trading')
      this.socket.emit('stop_trading')
      return true
    }
    return false
  }

  getNextStep() {
    if (this.socket && this.socket.connected) {
      console.log('Getting next trading step')
      this.socket.emit('next_trading_step')
      return true
    }
    return false
  }

  disconnectWebSocket() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    // Очищаем кэш цен при отключении
    this.currentPrices = {}
    this.priceUpdateCallbacks = []
  }

  isAuthenticated() {
    return !!this.getBrokerId()
  }

  logout() {
    localStorage.removeItem('brokerId')
    this.disconnectWebSocket()
  }

  handleApiError(error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'API Error')
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.')
    } else {
      throw new Error('Request configuration error')
    }
  }
}

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    brokerService.handleApiError(error)
    return Promise.reject(error)
  }
)

export const brokerService = new BrokerService()