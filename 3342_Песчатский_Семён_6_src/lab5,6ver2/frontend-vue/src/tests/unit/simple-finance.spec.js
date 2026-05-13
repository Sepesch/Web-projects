import { describe, it, expect } from 'vitest'

describe('Financial calculations for broker app', () => {
  // Эти тесты не требуют импорта компонентов или store
  
  describe('Profit/Loss calculations', () => {
    const calculateProfit = (buyPrice, sellPrice, quantity) => {
      return (sellPrice - buyPrice) * quantity
    }

    const calculateProfitPercent = (buyPrice, sellPrice) => {
      if (buyPrice === 0) return 0
      return ((sellPrice - buyPrice) / buyPrice) * 100
    }

    it('should calculate profit for positive change', () => {
      expect(calculateProfit(100, 120, 10)).toBe(200)
      expect(calculateProfit(50, 75, 4)).toBe(100)
    })

    it('should calculate loss for negative change', () => {
      expect(calculateProfit(100, 80, 10)).toBe(-200)
      expect(calculateProfit(200, 150, 5)).toBe(-250)
    })

    it('should calculate zero profit for no change', () => {
      expect(calculateProfit(100, 100, 10)).toBe(0)
    })

    it('should calculate profit percentage', () => {
      expect(calculateProfitPercent(100, 120)).toBe(20)
      expect(calculateProfitPercent(100, 80)).toBe(-20)
      expect(calculateProfitPercent(0, 100)).toBe(0)
    })
  })

  describe('Transaction validation', () => {
    const canBuyStock = (balance, stockPrice, quantity) => {
      if (stockPrice <= 0) return false
      if (quantity <= 0) return false
      return balance >= stockPrice * quantity
    }

    const canSellStock = (portfolioQuantity, sellQuantity) => {
      if (sellQuantity <= 0) return false
      return sellQuantity <= portfolioQuantity
    }

    it('should validate buy transactions', () => {
      expect(canBuyStock(1000, 100, 5)).toBe(true)
      expect(canBuyStock(1000, 100, 15)).toBe(false)
      expect(canBuyStock(1000, 0, 5)).toBe(false)
      expect(canBuyStock(0, 100, 5)).toBe(false)
      expect(canBuyStock(1000, 100, 0)).toBe(false)
    })

    it('should validate sell transactions', () => {
      expect(canSellStock(10, 5)).toBe(true)
      expect(canSellStock(10, 10)).toBe(true)
      expect(canSellStock(10, 15)).toBe(false)
      expect(canSellStock(0, 5)).toBe(false)
      expect(canSellStock(10, 0)).toBe(false)
    })
  })

  describe('Portfolio calculations', () => {
    const calculatePortfolioValue = (stocks, currentPrices) => {
      return stocks.reduce((total, stock) => {
        const price = currentPrices[stock.symbol] || 0
        return total + (price * stock.quantity)
      }, 0)
    }

    const calculateTotalProfit = (stocks, currentPrices) => {
      return stocks.reduce((total, stock) => {
        const currentPrice = currentPrices[stock.symbol] || 0
        return total + ((currentPrice - stock.purchasePrice) * stock.quantity)
      }, 0)
    }

    it('should calculate portfolio value', () => {
      const stocks = [
        { symbol: 'AAPL', quantity: 5, purchasePrice: 150 },
        { symbol: 'GOOGL', quantity: 2, purchasePrice: 2800 }
      ]

      const currentPrices = {
        'AAPL': 160,
        'GOOGL': 2850
      }

      expect(calculatePortfolioValue(stocks, currentPrices)).toBe(5 * 160 + 2 * 2850)
    })

    it('should calculate total profit', () => {
      const stocks = [
        { symbol: 'AAPL', quantity: 5, purchasePrice: 150 },
        { symbol: 'GOOGL', quantity: 2, purchasePrice: 2800 }
      ]

      const currentPrices = {
        'AAPL': 160,
        'GOOGL': 2850
      }

      // (160-150)*5 + (2850-2800)*2 = 50 + 100 = 150
      expect(calculateTotalProfit(stocks, currentPrices)).toBe(150)
    })
  })

  describe('Formatting functions', () => {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
    }

    const formatPercent = (percent) => {
      const sign = percent >= 0 ? '+' : ''
      return `${sign}${percent.toFixed(2)}%`
    }

    it('should format currency correctly', () => {
      expect(formatCurrency(1000)).toBe('1,000.00')
      expect(formatCurrency(1234.56)).toBe('1,234.56')
      expect(formatCurrency(0)).toBe('0.00')
      expect(formatCurrency(1000.5)).toBe('1,000.50')
    })

    it('should format percentages correctly', () => {
      expect(formatPercent(20)).toBe('+20.00%')
      expect(formatPercent(-15.5)).toBe('-15.50%')
      expect(formatPercent(0)).toBe('+0.00%')
    })
  })
})