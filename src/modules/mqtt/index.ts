import { MqttService } from './services/mqtt-service';
import { MqttContext, MqttInitOptions, MqttConfig } from './types';
import { getApi } from '../../core/api';

let mqttService: MqttService | null = null;
const logger = getApi('logger').api;

async function initialize({ config }: MqttInitOptions): Promise<MqttContext> {
  logger.info('Initializing MQTT module');

  const configApi = config.api;
  let mqttConfig: MqttConfig = configApi.getConfig('mqtt');
  
  if (!mqttConfig) {
    mqttConfig = {
      broker: 'mqtt://localhost',
      port: 1883,
      username: '',
      password: '',
      clientId: 'matter2mqtt',
      topicPrefix: 'matter/'
    };
    await configApi.setConfig('mqtt', mqttConfig);
    logger.info('Default MQTT config created');
  }

  mqttService = new MqttService(mqttConfig);
  await mqttService.connect();

  const context: MqttContext = {
    api: {
      publish: (topic, message, retain) => mqttService!.publish(topic, message, retain),
      subscribe: (topic, handler) => mqttService!.subscribe(topic, handler),
      unsubscribe: (topic) => mqttService!.unsubscribe(topic),
    }
  };

  return context;
}

async function cleanup(): Promise<void> {
  logger.info('Cleaning up MQTT module');
  if (mqttService) {
    await mqttService.disconnect();
    mqttService = null;
  }
}

export default { initialize, cleanup };
