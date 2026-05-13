import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { BrokersService } from '../brokers/brokers.service';

@Injectable()
export class AuthService {
  constructor(
    private brokersService: BrokersService,
    private jwtService: JwtService,
  ) {}

  async login(name: string, password: string) {
    const brokers = this.brokersService.getAllBrokers();
    const broker = brokers.find(b => b.name === name);
    
    if (!broker) {
      throw new UnauthorizedException('Брокер не найден');
    }

    // Для демо - простой пароль "123456"
    // В реальном приложении нужно хранить хеш пароля в базе
    const isValidPassword = password === '123456';
    
    if (!isValidPassword) {
      throw new UnauthorizedException('Неверный пароль');
    }

    const payload = { 
      username: broker.name, 
      sub: broker.id,
      role: 'broker'
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      broker: {
        id: broker.id,
        name: broker.name,
        currentFunds: broker.currentFunds,
        initialFunds: broker.initialFunds,
      },
    };
  }

  async register(name: string, password: string, initialFunds: number = 100000) {
    const brokers = this.brokersService.getAllBrokers();
    const existingBroker = brokers.find(b => b.name === name);
    
    if (existingBroker) {
      throw new ConflictException('Брокер с таким именем уже существует');
    }

    // Создаем нового брокера через ваш сервис
    const broker = this.brokersService.addBroker({
      name,
      initialFunds,
    });

    const payload = { 
      username: broker.name, 
      sub: broker.id,
      role: 'broker'
    };

    return {
      access_token: this.jwtService.sign(payload),
      broker: {
        id: broker.id,
        name: broker.name,
        currentFunds: broker.currentFunds,
        initialFunds: broker.initialFunds,
      },
    };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const broker = this.brokersService.getBrokerById(payload.sub);
      
      if (!broker) {
        throw new UnauthorizedException('Брокер не найден');
      }

      return {
        id: broker.id,
        name: broker.name,
        currentFunds: broker.currentFunds,
        initialFunds: broker.initialFunds,
      };
    } catch (error) {
      throw new UnauthorizedException('Неверный токен');
    }
  }

  extractTokenFromHeader(authHeader: string): string {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    return token;
  }
}