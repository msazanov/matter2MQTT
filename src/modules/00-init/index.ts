/**
 * Модуль инициализации конфигурации
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Logger } from "@matter/main";
import { MatterConfig, defaultConfig } from './types.js';

// Получаем путь к текущему файлу и директории для ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Получаем корневой путь проекта
const rootDir = path.resolve(__dirname, '../../..');

// Настройка логгера для модуля с префиксом m2M
const logger = Logger.get("m2M:Init");

// Путь к директории и файлу конфигурации
const configDir = path.join(rootDir, 'configs');
const configPath = path.join(configDir, 'config.json');

/**
 * Загрузка конфигурации из файла
 */
function loadConfig(): MatterConfig {
    try {
        // Проверяем, существует ли директория конфигурации, если нет - создаем
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
            logger.info(`Создана директория конфигурации: ${configDir}`);
        }

        if (!fs.existsSync(configPath)) {
            logger.info(`Файл конфигурации не найден, создается файл с настройками по умолчанию: ${configPath}`);
            fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
            return defaultConfig;
        }

        const configData = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configData) as MatterConfig;
        logger.info('Конфигурация успешно загружена');
        return config;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Ошибка при загрузке конфигурации: ${errorMessage}`);
        logger.info('Используются настройки по умолчанию');
        return defaultConfig;
    }
}

/**
 * Установка переменных окружения на основе конфигурации
 */
function setEnvironmentVariables(config: MatterConfig) {
    // MQTT переменные
    process.env.MQTT_BROKER = config.mqtt.broker;
    process.env.MQTT_PORT = config.mqtt.port.toString();
    if (config.mqtt.username) process.env.MQTT_USERNAME = config.mqtt.username;
    if (config.mqtt.password) process.env.MQTT_PASSWORD = config.mqtt.password;
    process.env.MQTT_CLIENT_ID = config.mqtt.clientId;
    process.env.MQTT_TOPIC_PREFIX = config.mqtt.topicPrefix;
    
    // Matter переменные
    process.env.MATTER_STORAGE = config.matter.storage;
    process.env.MATTER_VENDOR_ID = config.matter.vendorId.toString();
    process.env.MATTER_FABRIC_ID = config.matter.fabricId.toString();
    process.env.MATTER_ADMIN_FABRIC_LABEL = config.matter.adminFabricLabel;
    
    // Переменные логирования
    process.env.LOG_LEVEL = config.log.level;

    logger.debug('Переменные окружения установлены');
}

/**
 * Инициализация модуля конфигурации
 */
export async function initialize() {
    logger.info('Инициализация модуля...');
    
    // Загружаем конфигурацию
    let config = loadConfig();
    
    // Проверяем, нужно ли обновить существующий конфиг
    let configUpdated = false;
    
    // Проверяем clientId, если старый 'matter-bridge' - обновляем на 'matter2MQTT'
    if (config.mqtt.clientId === 'matter-bridge') {
        config.mqtt.clientId = 'matter2MQTT';
        configUpdated = true;
        logger.info('Обновлен clientId в конфигурации с "matter-bridge" на "matter2MQTT"');
    }
    
    // Если configUpdated, перезаписываем файл конфигурации
    if (configUpdated) {
        try {
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            logger.info('Файл конфигурации обновлен');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error(`Ошибка при обновлении конфигурации: ${errorMessage}`);
        }
    }
    
    // Устанавливаем переменные окружения
    setEnvironmentVariables(config);
    
    // Используем правильное свойство для установки уровня логирования
    Logger.defaultLogLevel = config.log.level as any;
    
    logger.info('Модуль инициализации завершил работу');
}
