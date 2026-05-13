import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { TradingService, TradingState, TradingHistoryPoint } from './trading.service';

@Controller('api/trading')
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  @Get('state')
  getTradingState(): TradingState {
    return this.tradingService.getTradingState();
  }

  @Post('start')
  startTrading(@Body() settings: any): TradingState {
    try {
      return this.tradingService.startTrading(settings);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('stop')
  stopTrading(): TradingState {
    return this.tradingService.stopTrading();
  }

  @Post('next')
  nextTradingStep(): TradingState {
    try {
      return this.tradingService.nextTradingStep();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('prices')
  getCurrentPrices(): { [symbol: string]: number } {
    return this.tradingService.getCurrentPrices();
  }

  @Get('history')
  getTradingHistory(): TradingHistoryPoint[] {
    return this.tradingService.getTradingHistory();
  }
}