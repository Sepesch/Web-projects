import express from 'express'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'

export class MockBrokerServer {
  constructor(port = 3000) {
    this.app = express()
    this.port = port
    this.server = null
    this.wss = null
    this.stockPrices = {
      'AAPL': 150.25,
      'GOOGL': 2750.50,
      'MSFT': 305.75,
      'TSLA': 750.30,
      'AMZN': 3400.00,
      'FB': 325.50,
      'NVDA': 600.75,
      'NFLX': 550.25
    }
    
    // Начальные цены для акций портфеля
    this.portfolioStocks = [
      { symbol: 'AAPL', quantity: 10, purchasePrice: 145.00 },
      { symbol: 'GOOGL', quantity: 5, purchasePrice: 2700.00 }
    ]
    
    this.userBalance = 10000.00
    this.setupRoutes()
  }
  
  setupRoutes() {
    this.app.use(express.json())
    
    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200)
      }
      next()
    })
    
    // Mock API endpoints
    this.app.post('/api/login', (req, res) => {
      const { username, password } = req.body
      console.log(`Login attempt: ${username}`)
      
      if (username && password) {
        res.json({ 
          token: 'mock-jwt-token-123456', 
          userId: 'test-user-123',
          username: username,
          balance: this.userBalance
        })
      } else {
        res.status(401).json({ error: 'Invalid credentials' })
      }
    })
    
    this.app.post('/api/logout', (req, res) => {
      console.log('User logged out')
      res.json({ success: true })
    })
    
    this.app.get('/api/stocks', (req, res) => {
      const stocks = Object.keys(this.stockPrices).map(symbol => ({
        symbol,
        name: this.getCompanyName(symbol),
        currentPrice: this.stockPrices[symbol],
        enabled: true
      }))
      
      res.json(stocks)
    })
    
    this.app.get('/api/portfolio', (req, res) => {
      const portfolio = this.portfolioStocks.map(stock => ({
        ...stock,
        name: this.getCompanyName(stock.symbol),
        currentPrice: this.stockPrices[stock.symbol] || 0,
        enabled: true
      }))
      
      res.json({
        stocks: portfolio,
        balance: this.userBalance,
        totalValue: portfolio.reduce((sum, stock) => {
          return sum + (stock.quantity * (this.stockPrices[stock.symbol] || 0))
        }, 0)
      })
    })
    
    this.app.post('/api/buy', (req, res) => {
      const { symbol, quantity } = req.body
      const price = this.stockPrices[symbol]
      
      if (!price) {
        return res.status(400).json({ error: 'Stock not found' })
      }
      
      const total = price * quantity
      
      if (total > this.userBalance) {
        return res.status(400).json({ error: 'Insufficient funds' })
      }
      
      // Обновляем баланс
      this.userBalance -= total
      
      // Добавляем или обновляем акцию в портфеле
      const existingStock = this.portfolioStocks.find(s => s.symbol === symbol)
      if (existingStock) {
        // Пересчитываем среднюю цену покупки
        const totalCost = (existingStock.quantity * existingStock.purchasePrice) + total
        existingStock.quantity += quantity
        existingStock.purchasePrice = totalCost / existingStock.quantity
      } else {
        this.portfolioStocks.push({
          symbol,
          quantity,
          purchasePrice: price
        })
      }
      
      res.json({
        success: true,
        message: `Purchased ${quantity} shares of ${symbol} at $${price}`,
        totalCost: total,
        newBalance: this.userBalance,
        portfolio: this.portfolioStocks
      })
    })
    
    this.app.post('/api/sell', (req, res) => {
      const { symbol, quantity } = req.body
      const price = this.stockPrices[symbol]
      
      if (!price) {
        return res.status(400).json({ error: 'Stock not found' })
      }
      
      const existingStock = this.portfolioStocks.find(s => s.symbol === symbol)
      if (!existingStock || existingStock.quantity < quantity) {
        return res.status(400).json({ error: 'Insufficient stock quantity' })
      }
      
      const total = price * quantity
      
      // Обновляем баланс
      this.userBalance += total
      
      // Обновляем портфель
      existingStock.quantity -= quantity
      if (existingStock.quantity === 0) {
        this.portfolioStocks = this.portfolioStocks.filter(s => s.symbol !== symbol)
      }
      
      res.json({
        success: true,
        message: `Sold ${quantity} shares of ${symbol} at $${price}`,
        totalRevenue: total,
        newBalance: this.userBalance,
        portfolio: this.portfolioStocks
      })
    })
    
    this.app.get('/api/trading-state', (req, res) => {
      const currentDate = new Date().toLocaleDateString('ru-RU')
      
      res.json({
        currentDate: currentDate,
        stockPrices: this.stockPrices,
        marketOpen: true,
        tradingVolume: 1500000
      })
    })
  }
  
  getCompanyName(symbol) {
    const names = {
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc. (Google)',
      'MSFT': 'Microsoft Corporation',
      'TSLA': 'Tesla Inc.',
      'AMZN': 'Amazon.com Inc.',
      'FB': 'Meta Platforms Inc.',
      'NVDA': 'NVIDIA Corporation',
      'NFLX': 'Netflix Inc.'
    }
    return names[symbol] || `${symbol} Company`
  }
  
  start() {
    const server = createServer(this.app)
    
    server.listen(this.port, () => {
      console.log(`✅ Mock broker server running on http://localhost:${this.port}`)
      console.log(`📊 Available endpoints:`)
      console.log(`   POST /api/login - User authentication`)
      console.log(`   GET  /api/stocks - Get all stocks`)
      console.log(`   GET  /api/portfolio - Get user portfolio`)
      console.log(`   POST /api/buy - Buy stocks`)
      console.log(`   POST /api/sell - Sell stocks`)
      console.log(`   GET  /api/trading-state - Get trading state`)
    })
    
    this.server = server
    
    // Setup WebSocket server
    this.wss = new WebSocketServer({ server })
    
    this.wss.on('connection', (ws) => {
      console.log('🔌 WebSocket client connected')
      
      // Отправляем начальное состояние
      ws.send(JSON.stringify({
        type: 'INITIAL_STATE',
        stocks: Object.keys(this.stockPrices).map(symbol => ({
          symbol,
          name: this.getCompanyName(symbol),
          currentPrice: this.stockPrices[symbol],
          enabled: true
        })),
        tradingState: {
          currentDate: new Date().toLocaleDateString('ru-RU'),
          stockPrices: this.stockPrices,
          marketOpen: true
        }
      }))
      
      // Симуляция изменения цен каждые 3 секунды
      this.priceUpdateInterval = setInterval(() => {
        this.simulatePriceChange()
        
        ws.send(JSON.stringify({
          type: 'PRICE_UPDATE',
          date: new Date().toLocaleDateString('ru-RU'),
          prices: this.stockPrices,
          timestamp: new Date().toISOString()
        }))
      }, 3000)
      
      ws.on('close', () => {
        console.log('🔌 WebSocket client disconnected')
        if (this.priceUpdateInterval) {
          clearInterval(this.priceUpdateInterval)
        }
      })
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error)
      })
    })
    
    return server
  }
  
  simulatePriceChange() {
    Object.keys(this.stockPrices).forEach(symbol => {
      // Случайное изменение цены от -1.5% до +1.5%
      const changePercent = (Math.random() * 3 - 1.5) / 100
      const newPrice = this.stockPrices[symbol] * (1 + changePercent)
      
      // Округляем до 2 знаков после запятой
      this.stockPrices[symbol] = Math.round(newPrice * 100) / 100
      
      // Гарантируем, что цена не опустится ниже 1
      if (this.stockPrices[symbol] < 1) {
        this.stockPrices[symbol] = 1.00
      }
    })
    
    console.log('📈 Simulated price update:', this.stockPrices)
  }
  
  stop() {
    if (this.wss) {
      this.wss.close()
      console.log('WebSocket server stopped')
    }
    if (this.server) {
      this.server.close()
      console.log('HTTP server stopped')
    }
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval)
    }
  }
}

// Запуск сервера, если файл запущен напрямую
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new MockBrokerServer(3001) // Используем порт 3001, чтобы не конфликтовать с dev сервером
  server.start()
  
  // Обработка остановки
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping mock server...')
    server.stop()
    process.exit(0)
  })
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Stopping mock server...')
    server.stop()
    process.exit(0)
  })
}