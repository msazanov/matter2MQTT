import mqtt, { MqttClient } from 'mqtt';
import { MqttConfig } from '../types';

export class MqttService {
  private client!: MqttClient;
  private config: MqttConfig;
  private handlers: Map<string, (topic: string, message: Buffer) => void> = new Map();

  constructor(config: MqttConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { broker, port, username, password, clientId } = this.config;
      const url = `${broker}:${port}`;

      this.client = mqtt.connect(url, { username, password, clientId });

      this.client.on('connect', () => {
        console.log('M2M:mqtt: Connected to broker', url);
        this.client.publish('matter/bridge/state', 'online', { retain: true });
        resolve();
      });

      this.client.on('message', (topic, message) => {
        const handler = this.handlers.get(topic);
        if (handler) handler(topic, message);
      });

      this.client.on('error', (error) => {
        console.error('M2M:mqtt: Connection error:', error);
        reject(error);
      });
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.client.connected) {
        this.client.publish('matter/bridge/state', 'offline', { retain: true }, () => {
            this.client.end(false, {}, () => {
                console.log('M2M:mqtt: Disconnected from broker');
                resolve();
              });
        });
      } else resolve();
    });
  }

  publish(topic: string, message: string | Buffer, retain = false): void {
    this.client.publish(topic, message, { retain });
  }

  subscribe(topic: string, handler: (topic: string, message: Buffer) => void): void {
    this.handlers.set(topic, handler);
    this.client.subscribe(topic);
  }

  unsubscribe(topic: string): void {
    this.handlers.delete(topic);
    this.client.unsubscribe(topic);
  }
}
