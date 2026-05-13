import { Controller, Get, Post, Put, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { BrokersService, Broker } from './brokers.service';

@Controller('api/brokers')
export class BrokersController {
  constructor(private readonly brokersService: BrokersService) {}

  @Get()
  getAllBrokers(): Broker[] {
    try {
      return this.brokersService.getAllBrokers();
    } catch (error) {
      throw new HttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  addBroker(@Body() brokerData: Omit<Broker, 'id' | 'currentFunds'>): Broker {
    try {
      return this.brokersService.addBroker(brokerData);
    } catch (error) {
      throw new HttpException(
        error.message,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Put(':id')
  updateBroker(@Param('id') id: string, @Body() updates: Partial<Broker>): Broker {
    try {
      return this.brokersService.updateBroker(id, updates);
    } catch (error) {
      throw new HttpException(
        error.message,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id')
  deleteBroker(@Param('id') id: string): { message: string } {
    try {
      this.brokersService.deleteBroker(id);
      return { message: 'Broker deleted successfully' };
    } catch (error) {
      throw new HttpException(
        error.message,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':id')
  getBroker(@Param('id') id: string): Broker {
    try {
      const broker = this.brokersService.getBrokerById(id);
      if (!broker) {
        throw new HttpException('Broker not found', HttpStatus.NOT_FOUND);
      }
      return broker;
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
}