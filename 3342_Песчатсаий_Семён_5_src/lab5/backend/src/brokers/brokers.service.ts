import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface Broker {
  id: string;
  name: string;
  initialFunds: number;
  currentFunds: number;
}

@Injectable()
export class BrokersService {
  private readonly dataPath = path.join(process.cwd(), 'data', 'brokers.json');

  private ensureDataDir(): void {
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private readBrokers(): Broker[] {
    try {
      this.ensureDataDir();
      if (!fs.existsSync(this.dataPath)) {
        // Create initial empty array
        this.writeBrokers([]);
        return [];
      }
      const data = fs.readFileSync(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading brokers file:', error);
      return [];
    }
  }

  private writeBrokers(brokers: Broker[]): void {
    try {
      this.ensureDataDir();
      fs.writeFileSync(this.dataPath, JSON.stringify(brokers, null, 2));
    } catch (error) {
      console.error('Error writing brokers file:', error);
      throw new Error('Failed to save brokers data');
    }
  }

  getAllBrokers(): Broker[] {
    return this.readBrokers();
  }

  addBroker(brokerData: Omit<Broker, 'id' | 'currentFunds'>): Broker {
    if (!brokerData.name || brokerData.name.trim() === '') {
      throw new Error('Broker name is required');
    }
    
    if (brokerData.initialFunds < 0) {
      throw new Error('Initial funds cannot be negative');
    }

    const brokers = this.readBrokers();
    const newBroker: Broker = {
      ...brokerData,
      id: Date.now().toString(),
      currentFunds: brokerData.initialFunds,
    };
    brokers.push(newBroker);
    this.writeBrokers(brokers);
    return newBroker;
  }

  updateBroker(id: string, updates: Partial<Broker>): Broker {
    const brokers = this.readBrokers();
    const index = brokers.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error('Broker not found');
    }
    
    if (updates.name !== undefined && updates.name.trim() === '') {
      throw new Error('Broker name cannot be empty');
    }
    
    if (updates.initialFunds !== undefined && updates.initialFunds < 0) {
      throw new Error('Initial funds cannot be negative');
    }

    brokers[index] = { ...brokers[index], ...updates };
    this.writeBrokers(brokers);
    return brokers[index];
  }

  deleteBroker(id: string): void {
    const brokers = this.readBrokers();
    const filtered = brokers.filter(b => b.id !== id);
    
    if (filtered.length === brokers.length) {
      throw new Error('Broker not found');
    }
    
    this.writeBrokers(filtered);
  }

  getBrokerById(id: string): Broker | undefined {
    const brokers = this.readBrokers();
    return brokers.find(b => b.id === id);
  }
}