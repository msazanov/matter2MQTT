import { MatterAPI, MatterConfig } from './types';
import { LoggerAPI } from '../../core/logger/types';
import { getApi } from '../../core/api';
import { randomBytes } from 'crypto';

class Matter implements MatterAPI {
  private logger: LoggerAPI;
  private config: MatterConfig;
  private mqttApi: any;
  private configApi: any;
  private wifiConfigTopic: string = 'matter/config/wifi';

  constructor(logger: LoggerAPI, mqttApi: any, configApi: any) {
    this.logger = logger;
    this.mqttApi = mqttApi;
    this.configApi = configApi;
    this.config = this.getDefaultConfig();
    this.setupMqttSubscriptions();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Matter module');
    // TODO: Implement Matter initialization
  }

  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up Matter module');
    // Unsubscribe from MQTT topics
    this.mqttApi.unsubscribe(this.wifiConfigTopic);
  }

  getConfig(): MatterConfig {
    return this.config;
  }

  private getDefaultConfig(): MatterConfig {
    // Generate a random 64-bit Fabric ID (8 bytes)
    // Convert to BigInt to handle the full 64-bit value
    const randomFabricId = BigInt('0x' + randomBytes(8).toString('hex'));
    
    return {
      wifi: {
        ssid: '',
        password: ''
      },
      deviceName: 'Matter2MQTT',
      vendorId: 0xFFF1,
      productId: 0x8001,
      fabricId: Number(randomFabricId) // Convert back to number for storage
    };
  }

  private setupMqttSubscriptions(): void {
    // Subscribe to WiFi configuration topic
    this.mqttApi.subscribe(this.wifiConfigTopic, (topic: string, message: Buffer) => {
      try {
        const wifiConfig = JSON.parse(message.toString());
        this.updateWifiConfig(wifiConfig);
      } catch (error: any) {
        this.logger.error('Failed to parse WiFi configuration', { error: error.message || String(error) });
      }
    });
    
    this.logger.info(`Subscribed to WiFi configuration topic: ${this.wifiConfigTopic}`);
  }

  private async updateWifiConfig(wifiConfig: { ssid: string, password: string }): Promise<void> {
    if (!wifiConfig.ssid) {
      this.logger.warn('Received WiFi configuration without SSID');
      return;
    }

    // Проверка длины пароля в соответствии с IEEE 802.11
    if (wifiConfig.password && wifiConfig.password.length < 8) {
      this.logger.warn('WiFi password is too short. Minimum length is 8 characters according to IEEE 802.11');
      this.mqttApi.publish(`${this.wifiConfigTopic}/status`, JSON.stringify({
        status: 'error',
        message: 'WiFi password is too short. Minimum length is 8 characters according to IEEE 802.11'
      }));
      return;
    }

    this.logger.info(`Updating WiFi configuration for SSID: ${wifiConfig.ssid}`);
    
    // Get current config
    const currentConfig = this.configApi.getConfig('matter') || this.getDefaultConfig();
    
    // Update WiFi credentials
    currentConfig.wifi = {
      ssid: wifiConfig.ssid,
      password: wifiConfig.password || ''
    };
    
    // Save updated config
    await this.configApi.setConfig('matter', currentConfig);
    
    // Update local config
    this.config = currentConfig;
    
    // Publish confirmation
    this.mqttApi.publish(`${this.wifiConfigTopic}/status`, JSON.stringify({
      status: 'success',
      message: `WiFi configuration updated for SSID: ${wifiConfig.ssid}`
    }));
    
    this.logger.info('WiFi configuration updated successfully');
  }
}

export default {
  initialize: async ({ config, mqtt }: { config: { api: any }, mqtt: { api: any } }) => {
    const loggerApi = getApi('logger').api;
    const configApi = config.api;
    const mqttApi = mqtt.api;
    
    // Load existing config or create default
    let matterConfig = configApi.getConfig('matter');
    if (!matterConfig) {
      // Generate a random 64-bit Fabric ID (8 bytes)
      const randomFabricId = BigInt('0x' + randomBytes(8).toString('hex'));
      
      matterConfig = {
        wifi: {
          ssid: '',
          password: ''
        },
        deviceName: 'Matter2MQTT',
        vendorId: 0xFFF1,
        productId: 0x8001,
        fabricId: Number(randomFabricId) // Convert back to number for storage
      };
      await configApi.setConfig('matter', matterConfig);
      loggerApi.info('Created default Matter configuration with random Fabric ID');
    }
    
    const matter = new Matter(loggerApi, mqttApi, configApi);
    await matter.initialize();
    return { api: matter };
  },
  cleanup: async () => {
    // Cleanup will be handled by the instance
  }
}; 