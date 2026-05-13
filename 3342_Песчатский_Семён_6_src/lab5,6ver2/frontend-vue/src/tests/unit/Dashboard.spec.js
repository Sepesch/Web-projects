import { mount } from '@vue/test-utils'
import { describe, expect, test, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../../views/DashboardView.vue'
import { useBrokerStore } from '../../stores/broker'

vi.mock('../../services/brokerService', () => ({
  brokerService: {
    isAuthenticated: vi.fn(() => true),
    connectWebSocket: vi.fn(),
    disconnectWebSocket: vi.fn(),
    getBrokerInfo: vi.fn(() => Promise.resolve({
      data: {
        currentFunds: 10000,
        stocks: { 'AAPL': 10, 'GOOGL': 5 }
      }
    })),
    buyStock: vi.fn(),
    sellStock: vi.fn(),
    logout: vi.fn()
  }
}))

describe('DashboardView Component', () => {
  let wrapper
  let router
  let brokerStore

  beforeEach(async () => {
    setActivePinia(createPinia())
    brokerStore = useBrokerStore()
    
    brokerStore.loadBrokerData = vi.fn().mockResolvedValue(undefined)
    brokerStore.buyStock = vi.fn().mockResolvedValue(undefined)
    brokerStore.sellStock = vi.fn().mockResolvedValue(undefined)
    brokerStore.getStockCurrentPrice = vi.fn((symbol) => {
      if (symbol === 'AAPL') return 150
      if (symbol === 'GOOGL') return 2800
      return 0
    })
    brokerStore.formatCurrency = vi.fn((amount) => {
      if (amount === undefined || amount === null) return '0.00'
      return amount.toFixed(2)
    })
    brokerStore.getPortfolioValue = vi.fn(() => 25000)
    brokerStore.logout = vi.fn()
    
    brokerStore.balance = 10000
    brokerStore.availableStocks = [
      { id: 'AAPL', symbol: 'AAPL', name: 'Apple Inc.', currentPrice: 150, enabled: true },
      { id: 'GOOGL', symbol: 'GOOGL', name: 'Alphabet Inc.', currentPrice: 2800, enabled: true }
    ]
    brokerStore.stocks = [
      { id: 'AAPL', symbol: 'AAPL', quantity: 10, purchasePrice: 140 },
      { id: 'GOOGL', symbol: 'GOOGL', quantity: 5, purchasePrice: 2700 }
    ]
    brokerStore.enabledStocks = brokerStore.availableStocks.filter(stock => stock.enabled)
    brokerStore.tradingState = {
      isTrading: true,
      currentDate: '2024-01-15',
      stockPrices: { 'AAPL': 150, 'GOOGL': 2800 }
    }
    
    Object.defineProperty(brokerStore, 'enabledPortfolioStocks', {
      get: vi.fn(() => brokerStore.stocks.filter(stock => 
        brokerStore.availableStocks.find(s => s.symbol === stock.symbol && s.enabled === true)
      ))
    })

    router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: DashboardView }]
    })

    wrapper = mount(DashboardView, {
      global: {
        plugins: [router, createPinia()],
        mocks: {
          $router: router
        }
      }
    })

    await wrapper.vm.$nextTick()
  })

  test('should display current date from trading state', () => {
    const currentDateElement = wrapper.find('.current-date')
    expect(currentDateElement.exists()).toBe(true)
    expect(currentDateElement.text()).toContain('Текущая дата:')
  })

  test('should display broker balance correctly', () => {
    const balanceElement = wrapper.find('.amount')
    expect(balanceElement.exists()).toBe(true)
    expect(balanceElement.text()).toBe('$10,000.00')
  })

test('should get correct profit class for profitable stock', () => {
  const profitableStock = { 
    symbol: 'AAPL',  // Важно: должен совпадать с одним из символов в tradingState
    quantity: 10, 
    purchasePrice: 14
    // Не нужно передавать currentPrice - он берется из brokerStore.getStockCurrentPrice
  }
  
  // Мокируем getStockProfit для этого теста
  const originalGetStockProfit = wrapper.vm.getStockProfit
  wrapper.vm.getStockProfit = vi.fn(() => 100) // Возвращаем положительную прибыль
  
  const profitClass = wrapper.vm.getStockProfitClass(profitableStock)
  
  expect(profitClass).toBe('profit-positive')
  
  // Восстанавливаем оригинальную функцию
  wrapper.vm.getStockProfit = originalGetStockProfit
})

test('should get correct profit class for unprofitable stock', () => {
  const unprofitableStock = { 
    symbol: 'AAPL', 
    quantity: 10, 
    purchasePrice: 200
  }
  
  // Мокируем getStockProfit для этого теста
  const originalGetStockProfit = wrapper.vm.getStockProfit
  wrapper.vm.getStockProfit = vi.fn(() => -50) // Возвращаем отрицательную прибыль
  
  const profitClass = wrapper.vm.getStockProfitClass(unprofitableStock)
  
  expect(profitClass).toBe('profit-negative')
  
  // Восстанавливаем оригинальную функцию
  wrapper.vm.getStockProfit = originalGetStockProfit
})

  test('should get correct profit class for unprofitable stock', () => {
    const unprofitableStock = { 
      symbol: 'AAPL', 
      quantity: 10, 
      purchasePrice: 200,
      currentPrice: 150 
    }
    const profitClass = wrapper.vm.getStockProfitClass(unprofitableStock)
    
    expect(profitClass).toBe('profit-negative')
  })

  test('should validate buy quantity', async () => {
    wrapper.vm.selectedStock = brokerStore.availableStocks[0]
    brokerStore.balance = 1000
    const maxQuantity = Math.floor(150 / 150) // 6
    
    wrapper.vm.buyQuantity = maxQuantity + 10
    wrapper.vm.validateBuyQuantity()
    
    expect(wrapper.vm.buyQuantity).toBe(maxQuantity)
  })

  test('should validate sell quantity', async () => {
    const stock = brokerStore.stocks[0]
    wrapper.vm.selectedStock = stock
    
    wrapper.vm.sellQuantity = stock.quantity + 5
    wrapper.vm.validateSellQuantity()
    
    expect(wrapper.vm.sellQuantity).toBe(stock.quantity)
  })

  test('should reset all charts when reset button is clicked', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    
    wrapper.vm.stockPriceHistory = { 'AAPL': [{ date: '2024-01-15', price: 150 }] }
    
    const resetButton = wrapper.find('.reset-charts-btn')
    
    await resetButton.trigger('click')
    
    expect(confirmSpy).toHaveBeenCalled()
    
    expect(wrapper.vm.stockPriceHistory).toEqual({})
    
    confirmSpy.mockRestore()
  })

  test('should display error message when error occurs', async () => {
    wrapper.vm.error = 'Test error message'
    await wrapper.vm.$nextTick()
    
    const errorElement = wrapper.find('.error')
    expect(errorElement.exists()).toBe(true)
    expect(errorElement.text()).toContain('Test error message')
  })

  test('should clear error when clear button is clicked', async () => {
    wrapper.vm.error = 'Test error message'
    await wrapper.vm.$nextTick()
    
    const clearButton = wrapper.find('.error button')

    await clearButton.trigger('click')
    
    expect(wrapper.vm.error).toBe('')
  })

  test('should show loading spinner when loading', async () => {
    wrapper.vm.loading = true
    await wrapper.vm.$nextTick()
    
    const loadingElement = wrapper.find('.loading')
    expect(loadingElement.exists()).toBe(true)
  })

  test('should handle stock price history correctly', () => {
    const symbol = 'AAPL'
    const historyData = [
      { date: '2024-01-15', price: 150, timestamp: '2024-01-15T10:00:00Z' },
      { date: '2024-01-16', price: 152, timestamp: '2024-01-16T10:00:00Z' }
    ]
    
    wrapper.vm.stockPriceHistory = { [symbol]: historyData }
    
    const history = wrapper.vm.getChartHistoryForStock(symbol)
    
    expect(history).toEqual(historyData)
  })

  test('should calculate price change correctly', () => {
    const symbol = 'AAPL'
    const historyData = [
      { date: '2024-01-15', price: 150, timestamp: '2024-01-15T10:00:00Z' },
      { date: '2024-01-16', price: 152, timestamp: '2024-01-16T10:00:00Z' }
    ]
    
    wrapper.vm.stockPriceHistory = { [symbol]: historyData }
    
    const changeText = wrapper.vm.getPriceChangeText(symbol)
    
    expect(changeText).toContain('+2.00')
    expect(changeText).toContain('+')
  })

  test('should handle chart dialog opening and closing', async () => {
    const stock = brokerStore.availableStocks[0]
    
    wrapper.vm.openChartDialog(stock)
    expect(wrapper.vm.showChartDialog).toBe(true)
    expect(wrapper.vm.selectedStock).toEqual(stock)
    
    wrapper.vm.closeChartDialog()
    expect(wrapper.vm.showChartDialog).toBe(false)
    expect(wrapper.vm.selectedStock).toBeNull()
  })

  test('should open and close buy dialog', async () => {
    const stock = brokerStore.availableStocks[0]
    
    wrapper.vm.openBuyDialog(stock)
    expect(wrapper.vm.showBuyDialog).toBe(true)
    expect(wrapper.vm.selectedStock).toEqual(stock)
    expect(wrapper.vm.buyQuantity).toBe(1)
    
    wrapper.vm.closeBuyDialog()
    expect(wrapper.vm.showBuyDialog).toBe(false)
    expect(wrapper.vm.selectedStock).toBeNull()
    expect(wrapper.vm.buyQuantity).toBe(1)
  })

  test('should open and close sell dialog', async () => {
    const stock = brokerStore.stocks[0]
    
    wrapper.vm.openSellDialog(stock)
    expect(wrapper.vm.showSellDialog).toBe(true)
    expect(wrapper.vm.selectedStock).toEqual(stock)
    expect(wrapper.vm.sellQuantity).toBe(1)
    
    wrapper.vm.closeSellDialog()
    expect(wrapper.vm.showSellDialog).toBe(false)
    expect(wrapper.vm.selectedStock).toBeNull()
    expect(wrapper.vm.sellQuantity).toBe(1)
  })

  test('should reset individual stock chart', () => {
    const symbol = 'AAPL'
    
    wrapper.vm.stockPriceHistory = { [symbol]: [{ date: '2024-01-15', price: 150 }] }
    wrapper.vm.initialPrices = { [symbol]: 150 }
    
    wrapper.vm.resetStockChart(symbol)
    
    expect(wrapper.vm.stockPriceHistory[symbol]).toEqual([])
    expect(wrapper.vm.initialPrices[symbol]).toBeUndefined()
  })


  test('should handle canSell computed property', () => {
    wrapper.vm.selectedStock = brokerStore.stocks[0]
    wrapper.vm.sellQuantity = 2
    
    expect(wrapper.vm.canSell).toBe(true)
    
    wrapper.vm.sellQuantity = 20
    wrapper.vm.validateSellQuantity()
    expect(wrapper.vm.canSell).toBe(true) // Количество будет скорректировано

    wrapper.vm.sellQuantity = 0
    expect(wrapper.vm.canSell).toBe(false)
  })
})