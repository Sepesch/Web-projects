import { Controller, Get, Put, Body, Param, HttpException, HttpStatus, Post } from '@nestjs/common';
import { StocksService, Stock, StockPrice } from './stocks.service';

@Controller('api/stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get()
  getAllStocks(): Stock[] {
    try {
      return this.stocksService.getAllStocks();
    } catch (error) {
      throw new HttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':symbol')
  updateStock(@Param('symbol') symbol: string, @Body() updates: Partial<Stock>): Stock {
    try {
      return this.stocksService.updateStock(symbol, updates);
    } catch (error) {
      throw new HttpException(
        error.message,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post(':symbol/history/load')
  async loadHistoricalData(@Param('symbol') symbol: string): Promise<{ message: string; data: StockPrice[] }> {
    try {
      const historicalData = await this.stocksService.loadHistoricalData(symbol);
      return {
        message: `Historical data loaded successfully for ${symbol}`,
        data: historicalData
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':symbol/history')
  getHistoricalData(@Param('symbol') symbol: string): StockPrice[] {
    try {
      return this.stocksService.getHistoricalData(symbol);
    } catch (error) {
      throw new HttpException(
        error.message,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':symbol')
  getStock(@Param('symbol') symbol: string): Stock {
    try {
      const stock = this.stocksService.getStockBySymbol(symbol);
      if (!stock) {
        throw new HttpException('Stock not found', HttpStatus.NOT_FOUND);
      }
      return stock;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('initialize-historical-data')
  async initializeHistoricalData(): Promise<{ message: string }> {
    try {
      await this.stocksService.initializeHistoricalData();
      return { message: 'Historical data initialized for all stocks' };
    } catch (error) {
      throw new HttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}