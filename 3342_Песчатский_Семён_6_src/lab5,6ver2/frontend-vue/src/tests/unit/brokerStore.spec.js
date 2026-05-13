import { describe, test, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useBrokerStore } from '../../stores/broker.js'

// Мокаем brokerService чтобы тесты не делали реальные запросы
vi.mock('../../services/brokerService', () => ({
  brokerService: {
    isAuthenticated: vi.fn(() => true),
    getBrokerInfo: vi.fn(() => Promise.resolve({
      data: {
        currentFunds: 10000,
        stocks: {
          'AAPL': 10
        }
      }
    })),
    buyStock: vi.fn(() => Promise.resolve({})),
    sellStock: vi.fn(() => Promise.resolve({})),
    logout: vi.fn()
  }
}))

describe('Broker Store', () => {
  let brokerStore

  beforeEach(() => {
    // Создаем новый экземпляр pinia для каждого теста
    const pinia = createPinia()
    setActivePinia(pinia)
    
    // Создаем экземпляр store
    brokerStore = useBrokerStore()
    
    // Настраиваем моковые данные для тестов
    brokerStore.availableStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.', currentPrice: 150, enabled: true, purchasePrice: 145 },
      { symbol: 'GOOGL', name: 'Google Inc.', currentPrice: 2800, enabled: true, purchasePrice: 2700 }
    ]
    
    brokerStore.tradingState = {
      stockPrices: {
        'AAPL': 150,
        'GOOGL': 2800
      }
    }
    
    brokerStore.balance = 10000
  })

  test('formatCurrency should format numbers correctly', () => {
    expect(brokerStore.formatCurrency(1000)).toBe('1,000.00')
    expect(brokerStore.formatCurrency(1234.56)).toBe('1,234.56')
    expect(brokerStore.formatCurrency(0)).toBe('0.00')
    expect(brokerStore.formatCurrency(1000.5)).toBe('1,000.50')
  })

  test('getStockCurrentPrice should return correct price', () => {
    // Проверяем цену из tradingState
    expect(brokerStore.getStockCurrentPrice('AAPL')).toBe(150)
    expect(brokerStore.getStockCurrentPrice('GOOGL')).toBe(2800)
    
    // Проверяем несуществующую акцию
    expect(brokerStore.getStockCurrentPrice('UNKNOWN')).toBe(0)
  })

  test('getStockProfit should calculate profit correctly', () => {
    const stock = {
      symbol: 'AAPL',
      quantity: 10,
      purchasePrice: 145
    }

    const profit = brokerStore.getStockProfit(stock)
    // (150 - 145) * 10 = 50
    expect(profit).toBe(50)
  })

  test('getStockProfit should handle zero purchase price', () => {
    const stock = {
      symbol: 'AAPL',
      quantity: 10,
      purchasePrice: 0
    }

    const profit = brokerStore.getStockProfit(stock)
    // (150 - 0) * 10 = 1500
    expect(profit).toBe(1500)
  })

  test('getStockProfitPercent should calculate percentage correctly', () => {
    const stock = {
      symbol: 'AAPL',
      quantity: 10,
      purchasePrice: 100
    }

    const percent = brokerStore.getStockProfitPercent(stock)
    // ((150 - 100) / 100) * 100 = 50%
    expect(percent).toBe(50)
  })

  test('getStockProfitClass should return correct class', () => {
    const profitableStock = {
      symbol: 'AAPL',
      quantity: 10,
      purchasePrice: 100
    }

    const lossStock = {
      symbol: 'GOOGL',
      quantity: 2,
      purchasePrice: 2900
    }

    expect(brokerStore.getStockProfitClass(profitableStock)).toBe('profit-positive')
    expect(brokerStore.getStockProfitClass(lossStock)).toBe('profit-negative')
  })

  test('getPortfolioValue should calculate portfolio value', () => {
    // Настраиваем портфель
    brokerStore.stocks = [
      { symbol: 'AAPL', quantity: 5, purchasePrice: 145 },
      { symbol: 'GOOGL', quantity: 2, purchasePrice: 2700 }
    ]

    const portfolioValue = brokerStore.getPortfolioValue()
    // (5 * 150) + (2 * 2800) = 750 + 5600 = 6350
    expect(portfolioValue).toBe(6350)
  })

  test('isStockEnabled should check if stock is enabled', () => {
    expect(brokerStore.isStockEnabled('AAPL')).toBe(true)
    expect(brokerStore.isStockEnabled('GOOGL')).toBe(true)
    
    // Добавим отключенную акцию
    brokerStore.availableStocks.push({
      symbol: 'DISABLED',
      name: 'Disabled Stock',
      currentPrice: 100,
      enabled: false
    })
    
    expect(brokerStore.isStockEnabled('DISABLED')).toBe(false)
  })

  test('enabledPortfolioStocks should filter only enabled stocks', () => {
    brokerStore.stocks = [
      { symbol: 'AAPL', quantity: 10, purchasePrice: 145 },
      { symbol: 'DISABLED', quantity: 5, purchasePrice: 100 }
    ]
    
    // Добавляем отключенную акцию в availableStocks
    brokerStore.availableStocks.push({
      symbol: 'DISABLED',
      name: 'Disabled Stock',
      currentPrice: 100,
      enabled: false
    })

    const enabledStocks = brokerStore.enabledPortfolioStocks
    expect(enabledStocks.length).toBe(1)
    expect(enabledStocks[0].symbol).toBe('AAPL')
  })

  test('enabledStocks should contain only enabled stocks', () => {
    brokerStore.availableStocks = [
      { symbol: 'AAPL', name: 'Apple', currentPrice: 150, enabled: true },
      { symbol: 'GOOGL', name: 'Google', currentPrice: 2800, enabled: true },
      { symbol: 'DISABLED', name: 'Disabled', currentPrice: 100, enabled: false }
    ]

    brokerStore.setAvailableStocks(brokerStore.availableStocks)
    
    expect(brokerStore.enabledStocks[0].symbol).toBe('AAPL')
    expect(brokerStore.enabledStocks[1].symbol).toBe('GOOGL')
  })

  test('setTradingState should update trading state', () => {
    const newState = {
      isTrading: true,
      currentDate: '2023-10-01',
      stockPrices: {
        'AAPL': 160,
        'GOOGL': 2850
      }
    }

    brokerStore.setTradingState(newState)
    
    expect(brokerStore.tradingState.isTrading).toBe(true)
    expect(brokerStore.tradingState.currentDate).toBe('2023-10-01')
    expect(brokerStore.tradingState.stockPrices.AAPL).toBe(160)
    expect(brokerStore.tradingState.stockPrices.GOOGL).toBe(2850)
  })

  test('updateStockPrices should update prices correctly', () => {
    const priceData = {
      prices: {
        'AAPL': 155,
        'GOOGL': 2820
      },
      date: '2023-10-02'
    }

    brokerStore.updateStockPrices(priceData)
    
    expect(brokerStore.tradingState.stockPrices.AAPL).toBe(155)
    expect(brokerStore.tradingState.stockPrices.GOOGL).toBe(2820)
    expect(brokerStore.tradingState.currentDate).toBe('2023-10-02')
    
    // Проверяем что цена обновилась в availableStocks
    const appleStock = brokerStore.availableStocks.find(s => s.symbol === 'AAPL')
    expect(appleStock.currentPrice).toBe(155)
  })

  test('buyStock should throw error for disabled stock', async () => {
    // Добавляем отключенную акцию
    brokerStore.availableStocks.push({
      symbol: 'DISABLED',
      name: 'Disabled Stock',
      currentPrice: 100,
      enabled: false
    })

    await expect(brokerStore.buyStock('DISABLED', 5)).rejects.toThrow(
      'Акция DISABLED отключена и не может быть куплена'
    )
  })
})

// Дополнительные тесты для бизнес-логики
describe('Broker Store Business Logic', () => {
  let brokerStore

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    brokerStore = useBrokerStore()
  })

  describe('Financial calculations for trading scenarios', () => {
    test('should simulate purchase scenario', () => {
      // Начальные условия
      const initialBalance = 10000
      const stockPrice = 150
      const quantity = 5
      
      brokerStore.balance = initialBalance
      brokerStore.tradingState.stockPrices = { 'AAPL': stockPrice }
      
      // Расчет стоимости покупки
      const purchaseCost = stockPrice * quantity
      const expectedBalance = initialBalance - purchaseCost
      
      expect(purchaseCost).toBe(750)
      expect(expectedBalance).toBe(9250)
    })

    test('should simulate profit calculation after price change', () => {
      // Исходные данные
      const stock = {
        symbol: 'AAPL',
        quantity: 10,
        purchasePrice: 100
      }
      
      // Изначальная цена
      brokerStore.tradingState.stockPrices = { 'AAPL': 100 }
      const initialProfit = brokerStore.getStockProfit(stock)
      expect(initialProfit).toBe(0) // Цена не изменилась
      
      // Цена выросла
      brokerStore.tradingState.stockPrices = { 'AAPL': 120 }
      const profitAfterIncrease = brokerStore.getStockProfit(stock)
      expect(profitAfterIncrease).toBe(200) // (120-100)*10
      
      // Цена упала
      brokerStore.tradingState.stockPrices = { 'AAPL': 80 }
      const profitAfterDecrease = brokerStore.getStockProfit(stock)
      expect(profitAfterDecrease).toBe(-200) // (80-100)*10
    })

    test('should calculate percentage changes correctly', () => {
      const stock = {
        symbol: 'AAPL',
        quantity: 5,
        purchasePrice: 100
      }
      
      brokerStore.tradingState.stockPrices = { 'AAPL': 120 }
      const percent = brokerStore.getStockProfitPercent(stock)
      expect(percent).toBe(20) // ((120-100)/100)*100
      
      brokerStore.tradingState.stockPrices = { 'AAPL': 80 }
      const percentLoss = brokerStore.getStockProfitPercent(stock)
      expect(percentLoss).toBe(-20) // ((80-100)/100)*100
    })
  })
})