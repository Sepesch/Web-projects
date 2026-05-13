import { Injectable } from '@nestjs/common';
import { StocksService, Stock } from '../stocks/stocks.service';

export interface TradingSettings {
  startDate: string;
  speed: number;
}

export interface TradingHistoryPoint {
  date: string;
  prices: { [symbol: string]: number };
}

export interface TradingState {
  isTrading: boolean;
  settings: TradingSettings;
  currentDateIndex: number;
  currentDate: string;
  stockPrices: { [symbol: string]: number };
  availableDates: string[];
  tradingHistory: TradingHistoryPoint[];
}

@Injectable()
export class TradingService {
  private tradingState: TradingState = {
    isTrading: false,
    settings: {
      startDate: '',
      speed: 1
    },
    currentDateIndex: 0,
    currentDate: '',
    stockPrices: {},
    availableDates: [],
    tradingHistory: []
  };

  constructor(private stocksService: StocksService) {}

  getTradingState(): TradingState {
    return this.tradingState;
  }

  startTrading(settings: TradingSettings): TradingState {
    if (this.tradingState.isTrading) {
      throw new Error('Trading is already in progress');
    }

    const stocks = this.stocksService.getAllStocks();
    const enabledStocks = stocks.filter(stock => stock.enabled);

    if (enabledStocks.length === 0) {
      throw new Error('No enabled stocks for trading');
    }

    let allDates: string[] = [];
    for (const stock of enabledStocks) {
      if (stock.history && stock.history.length > 0) {
        const stockDates = stock.history.map(h => h.date);
        allDates = [...allDates, ...stockDates];
      }
    }

    if (allDates.length === 0) {
      throw new Error('No historical data available for enabled stocks');
    }

    const uniqueDates = [...new Set(allDates)].sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    const initialPrices = this.getStockPricesForDate(uniqueDates[0], enabledStocks);

    this.tradingState = {
      isTrading: true,
      settings,
      currentDateIndex: 0,
      currentDate: uniqueDates[0],
      stockPrices: initialPrices,
      availableDates: uniqueDates,
      tradingHistory: [{
        date: uniqueDates[0],
        prices: initialPrices
      }]
    };

    return this.tradingState;
  }

  stopTrading(): TradingState {
    this.tradingState.isTrading = false;
    return this.tradingState;
  }

nextTradingStep(): TradingState {
  if (!this.tradingState.isTrading) {
    console.error('Trading is not in progress. Current state:', this.tradingState);
    throw new Error('Trading is not in progress');
  }

  const nextIndex = this.tradingState.currentDateIndex + 1;
  
  if (nextIndex >= this.tradingState.availableDates.length) {
    console.log('Trading simulation completed');
    this.tradingState.isTrading = false;
    return this.tradingState;
  }

  const stocks = this.stocksService.getAllStocks();
  const enabledStocks = stocks.filter(stock => stock.enabled);

  console.log('Moving to next step:', {
    currentIndex: this.tradingState.currentDateIndex,
    nextIndex,
    totalDates: this.tradingState.availableDates.length,
    enabledStocks: enabledStocks.length
  });

  this.tradingState.currentDateIndex = nextIndex;
  this.tradingState.currentDate = this.tradingState.availableDates[nextIndex];
  this.tradingState.stockPrices = this.getStockPricesForDate(
    this.tradingState.availableDates[nextIndex], 
    enabledStocks
  );

  // Добавляем точку в историю торгов
  this.tradingState.tradingHistory.push({
    date: this.tradingState.currentDate,
    prices: { ...this.tradingState.stockPrices }
  });

  console.log('Updated trading history length:', this.tradingState.tradingHistory.length);

  return this.tradingState;
}

  private getStockPricesForDate(date: string, stocks: Stock[]): { [symbol: string]: number } {
    const prices: { [symbol: string]: number } = {};

    stocks.forEach(stock => {
      const historicalData = stock.history.find(h => h.date === date);
      if (historicalData) {
        const priceStr = historicalData.open.replace('$', '');
        prices[stock.symbol] = parseFloat(priceStr);
      }
    });

    return prices;
  }

  getCurrentPrices(): { [symbol: string]: number } {
    return this.tradingState.stockPrices;
  }

  getTradingHistory(): TradingHistoryPoint[] {
    return this.tradingState.tradingHistory;
  }
}