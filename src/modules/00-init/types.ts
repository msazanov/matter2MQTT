/**
 * Типы и константы для модуля инициализации
 */

// Интерфейс для типизации конфигурации
export interface MatterConfig {
    mqtt: {
        broker: string;
        port: number;
        username?: string;
        password?: string;
        clientId: string;
        topicPrefix: string;
    };
    matter: {
        storage: string;
        vendorId: number;
        fabricId: number;
        adminFabricLabel: string;
    };
    log: {
        level: string;
    };
}

// Генерация псевдослучайного fabricId в диапазоне [1, 4294967295]
const generateRandomFabricId = (): number => {
    return Math.floor(Math.random() * 4294967295) + 1;
};

// Конфигурация по умолчанию
export const defaultConfig: MatterConfig = {
    mqtt: {
        broker: 'localhost',
        port: 1883,
        clientId: 'matter2MQTT', // Изменено с 'matter-bridge' на 'matter2MQTT'
        topicPrefix: 'matter/'
    },
    matter: {
        storage: './storage',
        vendorId: 0xFFF1, // Тестовый vendorId
        fabricId: generateRandomFabricId(), // Теперь генерируем уникальный fabricId
        adminFabricLabel: 'Matter MQTT Bridge'
    },
    log: {
        level: 'info'
    }
};
