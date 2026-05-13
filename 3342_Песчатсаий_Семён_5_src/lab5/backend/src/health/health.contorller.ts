import { Controller, Get } from '@nestjs/common';
import { WebsocketGateway } from '../../websocket/websocket.gateway';

@Controller('health')
export class HealthController {
  constructor(private readonly websocketGateway: WebsocketGateway) {}

  @Get('websocket')
  checkWebSocket() {
    const hasServer = !!this.websocketGateway.server;
    
    return {
      websocket_available: hasServer,
      status: hasServer ? 'RUNNING' : 'NOT_RUNNING',
      path: 'ws://localhost:3000/ws',
      timestamp: new Date().toISOString()
    };
  }

  @Get('test-broadcast')
  testBroadcast() {
    if (this.websocketGateway.server) {
      this.websocketGateway.server.emit('test_message', {
        message: 'Тест от сервера',
        timestamp: new Date().toISOString()
      });
      return { success: true, message: 'Тестовое сообщение отправлено' };
    }
    return { success: false, message: 'WebSocket сервер не доступен' };
  }
}