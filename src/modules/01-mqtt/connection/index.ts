import type { MqttClient, IClientOptions } from 'mqtt';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Logger } from '@matter/main';
import type { ConnectionConfig, MqttConnectionOptions } from './types.js';

class MqttConnectionManager {
  private client: MqttClient | null = null;
  private logger: Logger;
  private config: ConnectionConfig;
  private isDisconnecting = false;

  constructor(config: ConnectionConfig) {
    this.logger = Logger.get('m2M:mqtt:connection');
    this.config = config;
  }

  private getVersion(): string {
    try {
      const packagePath = resolve(process.cwd(), 'package.json');
      const packageData = JSON.parse(readFileSync(packagePath, 'utf8'));
      return packageData.version || 'unknown';
    } catch (error) {
      this.logger.warn('Could not read package.json version');
      return 'unknown';
    }
  }

  private safePublish(
    topic: string, 
    message: string, 
    options: { qos?: 0 | 1 | 2; retain?: boolean } = {}
  ): void {
    if (!this.client || this.isDisconnecting) {
      this.logger.warn(`Attempted to publish while disconnecting or client is not ready`);
      return;
    }
  
    try {
      this.client.publish(topic, message, {
        qos: options.qos ?? 1,
        retain: options.retain ?? true
      });
      this.logger.debug(`Published to ${topic}: ${message}`);
    } catch (error) {
      this.logger.warn(`Failed to publish to ${topic}: ${error}`);
    }
  }

  private publishBridgeState(state: 'online' | 'offline' | 'reconnecting' | 'error'): void {
    const topic = `${this.config.topicPrefix}bridge/state`;
    this.safePublish(topic, state);
    this.logger.info(`Published bridge state: ${state}`);
  }

  private publishBridgeInfo(): void {
    const bridgeInfo = {
      version: this.getVersion(),
      commit: 'unknown',
      config: {
        broker: this.config.broker,
        topicPrefix: this.config.topicPrefix
      }
    };

    const topic = `${this.config.topicPrefix}bridge/info`;
    this.safePublish(topic, JSON.stringify(bridgeInfo));
  }

  async connect(options?: MqttConnectionOptions): Promise<MqttClient> {
    const mqtt = await import('mqtt');
    
    return new Promise((resolve, reject) => {
      const protocol = this.config.useSSL ? 'mqtts' : 'mqtt';
      const broker = `${protocol}://${this.config.broker}:${this.config.port}`;

      const clientOptions: IClientOptions = {
        clientId: this.config.clientId,
        clean: true,
        reconnectPeriod: 5000,
        ...options
      };

      if (this.config.username && this.config.password) {
        clientOptions.username = this.config.username;
        clientOptions.password = this.config.password;
      }

      this.client = mqtt.connect(broker, clientOptions);
      this.isDisconnecting = false;

      this.client.on('connect', () => {
        this.logger.info('Connected to MQTT broker');
        this.publishBridgeInfo();
        this.publishBridgeState('online');
        
        if (this.client) {
          resolve(this.client);
        } else {
          reject(new Error('MQTT client failed to initialize'));
        }
      });

      this.client.on('reconnect', () => {
        if (this.isDisconnecting) return;
        this.logger.warn('Trying to reconnect to MQTT broker');
        this.publishBridgeState('reconnecting');
      });

      this.client.on('error', (error) => {
        if (this.isDisconnecting) return;
        this.logger.error(`MQTT error: ${error}`);
        this.publishBridgeState('error');
        
        if (!this.isDisconnecting) {
          reject(error);
        }
      });

      this.client.on('close', () => {
        if (this.isDisconnecting) return;
        this.logger.warn('MQTT connection closed');
        this.publishBridgeState('offline');
      });
    });
  }

  async disconnect(): Promise<void> {
    if (!this.client) return;
  
    return new Promise((resolve) => {
      // Отправляем сообщение "offline" перед началом отключения
      this.publishBridgeState('offline');
  
      // Удаление всех слушателей событий
      this.client?.removeAllListeners('connect');
      this.client?.removeAllListeners('reconnect');
      this.client?.removeAllListeners('error');
      
      this.client?.on('close', () => {
        this.logger.info('MQTT client closed');
        this.client = null;
        this.isDisconnecting = false;
        resolve();
      });
  
      // Устанавливаем флаг отключения и закрываем соединение
      this.isDisconnecting = true;
      this.client?.end();
    });
  }

  setupProcessHooks(): void {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'] as const;
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        this.logger.info(`Received ${signal}, starting graceful shutdown`);
        try {
          await this.disconnect();
          process.exit(0);
        } catch (error) {
          this.logger.error(`Error during graceful shutdown: ${error}`);
          process.exit(1);
        }
      });
    });
  }

  getClient(): MqttClient | null {
    return this.client;
  }
}

export { MqttConnectionManager };
export default MqttConnectionManager;