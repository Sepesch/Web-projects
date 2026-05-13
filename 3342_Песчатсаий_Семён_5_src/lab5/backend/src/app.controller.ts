// src/app.controller.ts
import { Controller, Post, Body, Inject } from '@nestjs/common';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { AppService } from './app.service';
@Controller('api')
export class AppController {
  constructor(
    @Inject(WebsocketGateway)
    private readonly websocketGateway: WebsocketGateway,
    private readonly appService: AppService
  ) {}

  @Post('message')
  async sendMessage(@Body() body: { message: string; type?: string }) {
    // this.websocketGateway.sendToAll('notification', {
    //   type: 'notification',
    //   message: body.message,
    //   from: 'server',
    //   timestamp: new Date().toISOString(),
    // });

    return { status: 'Message sent to all clients' };
  }

  @Post('message-to-client')
  async sendMessageToClient(
    @Body() body: { clientId: string; message: string },
  ) {
    // this.websocketGateway.sendToClient(body.clientId, 'private_message', {
    //   type: 'private_message',
    //   message: body.message,
    //   from: 'server',
    //   timestamp: new Date().toISOString(),
    // });

    return { status: `Message sent to client ${body.clientId}` };
  }

}
