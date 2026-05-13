import { Controller, Post, Body, Get, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { name: string; password: string }) {
    const { name, password } = body;
    return this.authService.login(name, password);
  }

  @Post('register')
  async register(@Body() body: { name: string; password: string; initialFunds?: number }) {
    const { name, password, initialFunds } = body;
    return this.authService.register(name, password, initialFunds);
  }

  @Get('profile')
  async getProfile(@Headers('authorization') authHeader: string) {
    const token = this.authService.extractTokenFromHeader(authHeader);
    return this.authService.validateToken(token);
  }

  @Post('verify')
  async verifyToken(@Body() body: { token: string }) {
    return this.authService.validateToken(body.token);
  }
}