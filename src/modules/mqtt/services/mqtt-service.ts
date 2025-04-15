import mqtt, { MqttClient } from 'mqtt';
import { MqttConfig } from '../types';
import { getApi } from '../../../core/api';

export class MqttService {
  private client!: MqttClient;
  private config: MqttConfig;
  private handlers: Map<string, (topic: string, message: Buffer) => void> = new Map();
  private logger = getApi('logger').api;

  constructor(config: MqttConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const { broker, port, username, password, clientId } = this.config;
      const url = `${broker}:${port}`;

      this.client = mqtt.connect(url, { username, password, clientId });

      this.client.on('connect', () => {
        this.logger.info('Connected to broker');
        this.client.publish('matter/bridge/state', 'online', { retain: true });
        this.logger.debug('matter/bridge/state online');
        resolve();
      });

      this.client.on('message', (topic, message) => {
        this.logger.debug(`Received message on ${topic}: ${message.toString()}`);
        const handler = this.handlers.get(topic);
        if (handler) handler(topic, message);
      });

      this.client.on('error', (error) => {
        this.logger.error(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
        reject(error);
      });
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.client.connected) {
        this.client.publish('matter/bridge/state', 'offline', { retain: true }, () => {
          this.client.end(false, {}, () => {
            this.logger.info('Disconnected from broker');
            this.logger.debug('matter/bridge/state offline');
            resolve();
          });
        });
      } else resolve();
    });
  }

  publish(topic: string, message: string | Buffer, retain = false): void {
    this.logger.debug(`Publishing message to ${topic}: ${message.toString()}`, { retain });
    this.client.publish(topic, message, { retain });
  }

  subscribe(topic: string, handler: (topic: string, message: Buffer) => void): void {
    this.logger.debug(`Subscribing to topic: ${topic}`);
    this.handlers.set(topic, handler);
    this.client.subscribe(topic);
  }

  unsubscribe(topic: string): void {
    this.logger.debug(`Unsubscribing from topic: ${topic}`);
    this.handlers.delete(topic);
    this.client.unsubscribe(topic);
  }
}
