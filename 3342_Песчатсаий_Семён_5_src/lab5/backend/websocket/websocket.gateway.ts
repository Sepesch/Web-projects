import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';

interface Client {
  id: string;
  socket: Socket;
}

interface Stock {
  symbol: string;
  name: string;
  enabled: boolean;
  currentPrice?: number;
  history?: StockHistory[];
}

interface StockHistory {
  date: string;
  open: string;
}

interface StockData {
  date: string;
  prices: { [symbol: string]: number };
}

interface TradingSettings {
  startDate: string;
  speed: number;
  stocks: string[];
  timestamp: string;
}


interface TradingState {
  isTrading: boolean;
  currentDate: string;
  stockPrices: { [symbol: string]: number };
  currentDateIndex: number;
  availableDates: string[];
  tradingHistory: TradingHistory[];
  completedTradingHistory: TradingHistory[];
  initialPrices: { [symbol: string]: number };
}

interface TradingHistory {
  date: string;
  prices: { [symbol: string]: number };
  timestamp: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private clients: Map<string, Client> = new Map();
  private stocks: Stock[] = [];
  private stockData: StockData[] = [];
  
  private tradingState: TradingState = {
    isTrading: false,
    currentDate: '',
    stockPrices: {},
    currentDateIndex: 0,
    availableDates: [],
    tradingHistory: [],
    completedTradingHistory: [],
    initialPrices: {},
  };

  constructor() {
    this.loadStocksFromHistoricalFolder();
    this.loadStocksConfig();
  }

  private loadStocksConfig(): void {
    try {
      const configPath = '/home/sepesch/ground/educ/web/lab5,6ver2/backend/data/stocks.json';
      
      if (!fs.existsSync(configPath)) {
        this.logger.warn('Stocks config file not found, using default enabled state');
        return;
      }

      const configData = fs.readFileSync(configPath, 'utf8');
      const configStocks: Stock[] = JSON.parse(configData);
      
      configStocks.forEach(configStock => {
        const existingStock = this.stocks.find(stock => stock.symbol === configStock.symbol);
        if (existingStock) {
          existingStock.enabled = configStock.enabled;
        }
      });

      this.logger.log(`Loaded stocks configuration for ${configStocks.length} stocks`);
      
    } catch (error) {
      this.logger.error('Error loading stocks config:', error);
    }
  }

  private loadStocksFromHistoricalFolder(): void {
    try {
      const historicalPath = '/home/sepesch/ground/educ/web/lab5,6ver2/backend/data/historical';
      
      if (!fs.existsSync(historicalPath)) {
        this.logger.error('Historical folder not found');
        return;
      }

      const files = fs.readdirSync(historicalPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      this.logger.log(`Found ${jsonFiles.length} stock files`);

      this.stocks = [];
      
      for (const file of jsonFiles) {
        try {
          const symbol = path.basename(file, '.json').toUpperCase();
          const filePath = path.join(historicalPath, file);
          const fileData = fs.readFileSync(filePath, 'utf8');
          const history: StockHistory[] = JSON.parse(fileData);
          
          const sortedHistory = history.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          const currentPrice = sortedHistory.length > 0 ? 
            this.parsePrice(sortedHistory[0].open) : 0;

          this.stocks.push({
            symbol,
            name: this.getStockName(symbol),
            enabled: true,
            currentPrice,
            history: sortedHistory
          });

        } catch (error) {
          this.logger.error(`Error loading ${file}:`, error);
        }
      }

      this.createCombinedStockData();
      
    } catch (error) {
      this.logger.error('Error loading stocks:', error);
    }
  }

  private createCombinedStockData(): void {
    const allDates = new Set<string>();
    
    this.stocks.forEach(stock => {
      if (stock.history) {
        stock.history.forEach(record => {
          allDates.add(record.date);
        });
      }
    });

    const sortedDates = Array.from(allDates).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    this.stockData = sortedDates.map(date => {
      const prices: { [symbol: string]: number } = {};
      
      this.stocks.forEach(stock => {
        if (stock.history) {
          const historyRecord = stock.history.find(record => record.date === date);
          if (historyRecord) {
            prices[stock.symbol] = this.parsePrice(historyRecord.open);
          }
        }
      });

      return { date, prices };
    });

    this.logger.log(`Created data for ${this.stockData.length} trading days`);
  }

  private parsePrice(priceString: string): number {
    return parseFloat(priceString.replace('$', '').replace(',', ''));
  }

  private getStockName(symbol: string): string {
    const stockNames: { [key: string]: string } = {
      'AAPL': 'Apple, Inc.',
      'SBUX': 'Starbucks, Inc.',
      'MSFT': 'Microsoft, Inc.',
      'CSCO': 'Cisco Systems, Inc.',
      'QCOM': 'QUALCOMM Incorporated',
      'AMZN': 'Amazon.com, Inc.',
      'TSLA': 'Tesla, Inc.',
      'AMD': 'Advanced Micro Devices, Inc.',
      'META': 'Meta Platforms, Inc.',
      'NFLX': 'Netflix, Inc.'
    };

    return stockNames[symbol] || `${symbol} Company`;
  }

  private getAvailableDates(): string[] {
    return [...this.stockData]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(day => day.date);
  }

  private getPricesForDate(date: string): { [symbol: string]: number } | null {
    const dayData = this.stockData.find(day => day.date === date);
    return dayData ? dayData.prices : null;
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.clients.set(client.id, { id: client.id, socket: client });
    
    client.emit('connected', { 
      message: 'Connected to trading server',
      clientId: client.id,
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clients.delete(client.id);
  }

  @SubscribeMessage('get_trading_state')
  handleGetTradingState(@ConnectedSocket() client: Socket): void {
    client.emit('trading_state', {
      ...this.tradingState,
      timestamp: new Date().toISOString()
    });
  }

  @SubscribeMessage('get_stocks')
  handleGetStocks(@ConnectedSocket() client: Socket): void {
    this.loadStocksConfig();
    const enabledStocks = this.stocks.filter(stock => stock.enabled);
    const stocksForClient = enabledStocks.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      enabled: stock.enabled,
      currentPrice: stock.currentPrice
    }));
    console.log(stocksForClient);
    client.emit('stocks_data', {
      stocks: stocksForClient,
      timestamp: new Date().toISOString()
    });
  }

  @SubscribeMessage('get_available_dates')
  handleGetAvailableDates(@ConnectedSocket() client: Socket): void {
    const availableDates = this.getAvailableDates();
    
    client.emit('available_dates', {
      dates: availableDates,
      total: availableDates.length,
      timestamp: new Date().toISOString()
    });
  }

  @SubscribeMessage('start_trading')
  handleStartTrading(@ConnectedSocket() client: Socket, @MessageBody() payload: TradingSettings): void {
    try {
      const allDates = this.getAvailableDates();
      const startDateIndex = allDates.findIndex(date => date === payload.startDate);
      if (startDateIndex === -1) {
        throw new Error(`Start date ${payload.startDate} not found`);
      }

      const availableDates = allDates.slice(startDateIndex);
      const initialPrices = this.getPricesForDate(payload.startDate);
      if (!initialPrices) {
        throw new Error(`No price data for date ${payload.startDate}`);
      }

      // Используем только акции с enabled: true
      const enabledStocks = this.stocks.filter(stock => 
        stock.enabled && payload.stocks.includes(stock.symbol)
      );
      
      const filteredInitialPrices: { [symbol: string]: number } = {};
      enabledStocks.forEach(stock => {
        if (initialPrices[stock.symbol] !== undefined) {
          filteredInitialPrices[stock.symbol] = initialPrices[stock.symbol];
        } else {
          filteredInitialPrices[stock.symbol] = stock.currentPrice || 0;
        }
      });

      this.tradingState = {
        isTrading: true,
        currentDate: payload.startDate,
        stockPrices: { ...filteredInitialPrices },
        currentDateIndex: 0,
        availableDates: availableDates,
        tradingHistory: [{
          date: payload.startDate,
          prices: { ...filteredInitialPrices },
          timestamp: new Date().toISOString()
        }],
        completedTradingHistory: [],
        initialPrices: { ...filteredInitialPrices },
      };
      client.emit('trading_started', {
        ...this.tradingState,
        message: 'Trading started',
        timestamp: new Date().toISOString()
      });

      this.broadcastToAll('trading_state', this.tradingState);

    } catch (error) {
      client.emit('trading_error', {
        error: 'Failed to start trading',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  @SubscribeMessage('stop_trading')
  handleStopTrading(@ConnectedSocket() client: Socket): void {
    try {
      const completedSession = {
        history: [...this.tradingState.tradingHistory],
        startedAt: this.tradingState.tradingHistory[0]?.timestamp,
        endedAt: new Date().toISOString(),
        duration: this.tradingState.tradingHistory.length
      };

      this.tradingState = {
        ...this.tradingState,
        isTrading: false,
        completedTradingHistory: completedSession.history,
        tradingHistory: []
      };

      client.emit('trading_stopped', {
        ...this.tradingState,
        completedSession: completedSession,
        message: 'Trading stopped',
        timestamp: new Date().toISOString()
      });

      this.broadcastToAll('trading_state', this.tradingState);

    } catch (error) {
      client.emit('trading_error', {
        error: 'Failed to stop trading',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  @SubscribeMessage('next_trading_step')
  handleNextTradingStep(@ConnectedSocket() client: Socket): void {
    if (!this.tradingState.isTrading) {
      client.emit('trading_error', {
        error: 'Trading is not active',
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      const nextDateIndex = this.tradingState.currentDateIndex + 1;
      
      if (nextDateIndex >= this.tradingState.availableDates.length) {
        this.handleStopTrading(client);
        return;
      }

      const nextDate = this.tradingState.availableDates[nextDateIndex];
      const newPricesData = this.getPricesForDate(nextDate);
      
      if (!newPricesData) {
        throw new Error(`No price data for date ${nextDate}`);
      }

      const newPrices: { [symbol: string]: number } = {};
      // Используем только акции с enabled: true
      const enabledStocks = this.stocks.filter(stock => stock.enabled);

      enabledStocks.forEach(stock => {
        if (newPricesData[stock.symbol] !== undefined) {
          newPrices[stock.symbol] = newPricesData[stock.symbol];
        } else {
          newPrices[stock.symbol] = this.tradingState.stockPrices[stock.symbol] || stock.currentPrice || 0;
        }
      });

      this.tradingState.currentDateIndex = nextDateIndex;
      this.tradingState.currentDate = nextDate;
      this.tradingState.stockPrices = newPrices;
      
      this.tradingState.tradingHistory.push({
        date: nextDate,
        prices: { ...newPrices },
        timestamp: new Date().toISOString()
      });
      client.emit('next_step', {
        ...this.tradingState,
        timestamp: new Date().toISOString()
      });

      this.broadcastToAll('price_update', {
        prices: newPrices,
        date: nextDate,
        dateIndex: nextDateIndex,
        timestamp: new Date().toISOString()
      });

      this.broadcastToAll('trading_state', this.tradingState);

    } catch (error) {
      client.emit('trading_error', {
        error: 'Failed to proceed to next step',
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  private broadcastToAll(event: string, data: any): void {
    this.server.emit(event, data);
  }
}