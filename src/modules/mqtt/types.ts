export interface MqttConfig {
    broker: string;
    port: number;
    username?: string;
    password?: string;
    clientId?: string;
    topicPrefix?: string;
  }
  
  export interface MqttInitOptions {
    config: any; // модуль config
  }
  
  export interface MqttAPI {
    publish(topic: string, message: string | Buffer, retain?: boolean): void;
    subscribe(topic: string, handler: (topic: string, message: Buffer) => void): void;
    unsubscribe(topic: string): void;
  }
  
  export interface MqttContext {
    api: MqttAPI;
  }
  