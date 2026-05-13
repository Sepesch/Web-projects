import { Module } from '@nestjs/common';
import { BrokersModule } from './brokers/brokers.module';
import { StocksModule } from './stocks/stocks.module';
import { TradingModule } from './trading/trading.module';
import { AuthModule } from './auth/auth.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { HealthController } from './health/health.contorller';

@Module({
  imports: [
    BrokersModule, 
    StocksModule, 
    TradingModule, 
    AuthModule, 
    WebsocketModule
  ],
  controllers: [HealthController],
  providers: [WebsocketGateway],
})
export class AppModule {}