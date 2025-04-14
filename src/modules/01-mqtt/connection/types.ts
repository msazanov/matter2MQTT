import type { IClientOptions } from 'mqtt';

export interface ConnectionConfig {
  broker: string;
  port: number;
  clientId: string;
  topicPrefix: string;
  username?: string;
  password?: string;
  useSSL?: boolean;
  networks?: {
    wifi?: {
      ssids?: Array<{
        ssid: string;
        credentials: string;
      }>;
    };
    thread?: {
      networks?: Array<{
        networkName: string;
        operationalDataset: string;
      }>;
    };
  };
}

export type MqttConnectionOptions = Partial<IClientOptions>;