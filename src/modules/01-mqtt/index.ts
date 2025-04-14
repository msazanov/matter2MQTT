import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Logger } from '@matter/main';
import { MqttConnectionManager } from './connection/index.js';
import type { ConnectionConfig } from './connection/types.js';

export async function initialize() {
  const logger = Logger.get('m2M:mqtt');
  
  // Загрузка конфигурации
  const configPath = resolve(process.cwd(), 'configs', 'config.json');
  let config: { mqtt: ConnectionConfig };

  try {
    const configData = readFileSync(configPath, 'utf8');
    config = JSON.parse(configData);
    logger.info(`Loaded MQTT configuration from ${configPath}`);
  } catch (error) {
    logger.error(`Failed to load MQTT configuration: ${error}`);
    throw new Error('Failed to load MQTT configuration');
  }

  // Создаем экземпляр подключения
  const connectionManager = new MqttConnectionManager(config.mqtt);

  // Устанавливаем обработчики завершения процесса
  connectionManager.setupProcessHooks();

  // Подключаемся к MQTT
  await connectionManager.connect();

  return {
    connection: connectionManager
  };
}

export { MqttConnectionManager };
export default { initialize };