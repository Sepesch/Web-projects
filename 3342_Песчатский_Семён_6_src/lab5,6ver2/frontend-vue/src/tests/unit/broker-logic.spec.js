import { describe, it, expect } from 'vitest'

describe('Broker application logic', () => {
  describe('Stock filtering and validation', () => {
    const getTradingStocks = (allStocks, tradingState) => {
      if (!tradingState?.stockPrices) return []
      
      const tradingSymbols = Object.keys(tradingState.stockPrices)
      return allStocks.filter(stock => 
        tradingSymbols.includes(stock.symbol) && stock.enabled
      )
    }

    const getEnabledPortfolioStocks = (portfolioStocks) => {
      return portfolioStocks.filter(stock => stock.enabled !== false)
    }

    it('should filter trading stocks correctly', () => {
      const allStocks = [
        { symbol: 'AAPL', name: 'Apple', enabled: true },
        { symbol: 'GOOGL', name: 'Google', enabled: true },
        { symbol: 'DISABLED', name: 'Disabled', enabled: false }
      ]

      const tradingState = {
        stockPrices: {
          'AAPL': 150,
          'GOOGL': 2800
        }
      }

      const tradingStocks = getTradingStocks(allStocks, tradingState)
      expect(tradingStocks.length).toBe(2)
      expect(tradingStocks[0].symbol).toBe('AAPL')
      expect(tradingStocks[1].symbol).toBe('GOOGL')
    })

    it('should filter enabled portfolio stocks', () => {
      const portfolioStocks = [
        { symbol: 'AAPL', quantity: 10, enabled: true },
        { symbol: 'GOOGL', quantity: 5, enabled: true },
        { symbol: 'DISABLED', quantity: 3, enabled: false }
      ]

      const enabledStocks = getEnabledPortfolioStocks(portfolioStocks)
      expect(enabledStocks.length).toBe(2)
      expect(enabledStocks[0].symbol).toBe('AAPL')
      expect(enabledStocks[1].symbol).toBe('GOOGL')
    })
  })

  describe('Stock price calculations', () => {
    const getStockCurrentPrice = (symbol, tradingState) => {
      if (tradingState?.stockPrices?.[symbol]) {
        return tradingState.stockPrices[symbol]
      }
      return 0
    }

    const getTransactionTotal = (price, quantity) => {
      return price * quantity
    }

    const getMaxBuyQuantity = (balance, price) => {
      if (price <= 0) return 0
      return Math.floor(balance / price)
    }

    it('should get current stock price', () => {
      const tradingState = {
        stockPrices: {
          'AAPL': 150.25,
          'GOOGL': 2750.50
        }
      }

      expect(getStockCurrentPrice('AAPL', tradingState)).toBe(150.25)
      expect(getStockCurrentPrice('GOOGL', tradingState)).toBe(2750.50)
      expect(getStockCurrentPrice('UNKNOWN', tradingState)).toBe(0)
      expect(getStockCurrentPrice('AAPL', null)).toBe(0)
    })

    it('should calculate transaction total', () => {
      expect(getTransactionTotal(150.25, 3)).toBe(450.75)
      expect(getTransactionTotal(0, 10)).toBe(0)
      expect(getTransactionTotal(100, 0)).toBe(0)
      expect(getTransactionTotal(75.50, 4)).toBe(302)
    })

    it('should calculate max buy quantity', () => {
      expect(getMaxBuyQuantity(1000, 100)).toBe(10)
      expect(getMaxBuyQuantity(1000, 150)).toBe(6)
      expect(getMaxBuyQuantity(1000, 0)).toBe(0)
      expect(getMaxBuyQuantity(0, 100)).toBe(0)
      expect(getMaxBuyQuantity(450, 100)).toBe(4)
    })
  })

  describe('Chart calculations', () => {
    const calculateChartPath = (prices, width, height) => {
      if (prices.length < 2) return ''
      
      const maxPrice = Math.max(...prices)
      const minPrice = Math.min(...prices)
      const range = maxPrice - minPrice || 1
      
      const padding = 10
      const effectiveHeight = height - padding * 2
      const effectiveWidth = width - padding * 2
      
      let path = `M ${padding} `
      const firstPoint = ((maxPrice - prices[0]) / range) * effectiveHeight + padding
      path += firstPoint
      
      for (let i = 1; i < prices.length; i++) {
        const x = padding + (i / (prices.length - 1)) * effectiveWidth
        const y = ((maxPrice - prices[i]) / range) * effectiveHeight + padding
        path += ` L ${x} ${y}`
      }
      
      return path
    }

    const calculatePriceChange = (prices) => {
      if (prices.length < 2) return { change: 0, percent: 0 }
      
      const firstPrice = prices[0]
      const lastPrice = prices[prices.length - 1]
      const change = lastPrice - firstPrice
      const percent = firstPrice !== 0 ? (change / firstPrice) * 100 : 0
      
      return { change, percent }
    }

    it('should calculate chart path for increasing prices', () => {
      const prices = [100, 110, 120, 130, 140]
      const path = calculateChartPath(prices, 200, 100)
      
      expect(path).toBeTruthy()
      expect(path.startsWith('M 10 ')).toBe(true)
      expect(path.includes('L')).toBe(true)
    })

    it('should calculate chart path for decreasing prices', () => {
      const prices = [140, 130, 120, 110, 100]
      const path = calculateChartPath(prices, 200, 100)
      
      expect(path).toBeTruthy()
      expect(path.startsWith('M 10 ')).toBe(true)
    })

    it('should calculate price change correctly', () => {
      const prices1 = [100, 110, 120, 130, 140]
      const change1 = calculatePriceChange(prices1)
      expect(change1.change).toBe(40)
      expect(change1.percent).toBe(40)

      const prices2 = [100, 90, 80, 70, 60]
      const change2 = calculatePriceChange(prices2)
      expect(change2.change).toBe(-40)
      expect(change2.percent).toBe(-40)

      const prices3 = [100, 100, 100, 100, 100]
      const change3 = calculatePriceChange(prices3)
      expect(change3.change).toBe(0)
      expect(change3.percent).toBe(0)
    })
  })
})