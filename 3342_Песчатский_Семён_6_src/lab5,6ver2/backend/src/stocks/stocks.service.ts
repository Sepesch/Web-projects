import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface StockPrice {
  date: string;
  open: string; // Сохраняем как строку с $
}

export interface Stock {
  symbol: string;
  name: string;
  enabled: boolean;
  history: StockPrice[];
  currentPrice?: number;
}

@Injectable()
export class StocksService {
  private readonly dataPath = path.join(process.cwd(), 'data', 'stocks.json');
  private readonly historicalDataPath = path.join(process.cwd(), 'data', 'historical');

  private ensureDataDir(): void {
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.historicalDataPath)) {
      fs.mkdirSync(this.historicalDataPath, { recursive: true });
    }
  }

  private readStocks(): Stock[] {
    try {
      this.ensureDataDir();
      if (!fs.existsSync(this.dataPath)) {
        const defaultStocks = this.getDefaultStocks();
        this.writeStocks(defaultStocks);
        return defaultStocks;
      }
      const data = fs.readFileSync(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading stocks file:', error);
      return this.getDefaultStocks();
    }
  }

  private writeStocks(stocks: Stock[]): void {
    try {
      this.ensureDataDir();
      fs.writeFileSync(this.dataPath, JSON.stringify(stocks, null, 2));
    } catch (error) {
      console.error('Error writing stocks file:', error);
      throw new Error('Failed to save stocks data');
    }
  }

  private getDefaultStocks(): Stock[] {
    return [
      { symbol: 'AAPL', name: 'Apple, Inc.', enabled: true, history: [] },
      { symbol: 'SBUX', name: 'Starbucks, Inc.', enabled: true, history: [] },
      { symbol: 'MSFT', name: 'Microsoft, Inc.', enabled: true, history: [] },
      { symbol: 'CSCO', name: 'Cisco Systems, Inc.', enabled: true, history: [] },
      { symbol: 'QCOM', name: 'QUALCOMM Incorporated', enabled: true, history: [] },
      { symbol: 'AMZN', name: 'Amazon.com, Inc.', enabled: true, history: [] },
      { symbol: 'TSLA', name: 'Tesla, Inc.', enabled: true, history: [] },
      { symbol: 'AMD', name: 'Advanced Micro Devices, Inc.', enabled: true, history: [] },
      { symbol: 'META', name: 'Meta Platforms, Inc.', enabled: true, history: [] },
      { symbol: 'NFLX', name: 'Netflix, Inc.', enabled: true, history: [] }
    ];
  }

  getAllStocks(): Stock[] {
    return this.readStocks();
  }

  updateStock(symbol: string, updates: Partial<Stock>): Stock {
    const stocks = this.readStocks();
    const index = stocks.findIndex(s => s.symbol === symbol);
    if (index === -1) {
      throw new Error('Stock not found');
    }
    
    stocks[index] = { ...stocks[index], ...updates };
    this.writeStocks(stocks);
    return stocks[index];
  }

  async loadHistoricalData(symbol: string): Promise<StockPrice[]> {
    try {
      const historicalFilePath = path.join(this.historicalDataPath, `${symbol}.json`);
      
      if (!fs.existsSync(historicalFilePath)) {
        throw new Error(`Historical data file not found for ${symbol}`);
      }

      const data = fs.readFileSync(historicalFilePath, 'utf8');
      const historicalData: StockPrice[] = JSON.parse(data);

      // Обновляем акцию с историческими данными
      const stocks = this.readStocks();
      const index = stocks.findIndex(s => s.symbol === symbol);
      if (index !== -1) {
        stocks[index].history = historicalData;
        this.writeStocks(stocks);
      }

      return historicalData;
    } catch (error) {
      console.error(`Error loading historical data for ${symbol}:`, error);
      throw new Error(`Failed to load historical data for ${symbol}`);
    }
  }

  getStockBySymbol(symbol: string): Stock | undefined {
    const stocks = this.readStocks();
    return stocks.find(s => s.symbol === symbol);
  }

  getHistoricalData(symbol: string): StockPrice[] {
    const stock = this.getStockBySymbol(symbol);
    return stock?.history || [];
  }

  // Метод для инициализации исторических данных (можно вызвать один раз)
  async initializeHistoricalData(): Promise<void> {
    const symbols = ['AAPL', 'SBUX', 'MSFT', 'CSCO', 'QCOM', 'AMZN', 'TSLA', 'AMD', 'META', 'NFLX'];
    
    for (const symbol of symbols) {
      try {
        await this.loadHistoricalData(symbol);
        console.log(`Historical data loaded for ${symbol}`);
      } catch (error) {
        console.error(`Failed to load historical data for ${symbol}:`, error);
      }
    }
  }
}