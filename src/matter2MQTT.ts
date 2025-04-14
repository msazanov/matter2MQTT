#!/usr/bin/env node
/**
 * Matter to MQTT Bridge Server
 * 
 * Основной файл, который загружает модули и запускает сервер
 */

import * as path from 'path';
import * as fs from 'fs';
import { Environment, Logger } from "@matter/main";
import { fileURLToPath } from 'url';

// Получаем путь к текущему файлу и директории для ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Настройка базового логгера с сокращенным именем
const logger = Logger.get("m2M");

// Загрузка модулей
async function loadModules() {
    try {
        const modulesDir = path.join(__dirname, 'modules');
        
        // Проверяем, существует ли директория с модулями
        if (!fs.existsSync(modulesDir)) {
            throw new Error(`Директория модулей не найдена: ${modulesDir}`);
        }
        
        // Получаем список всех директорий в папке модулей
        const folders = fs.readdirSync(modulesDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)
            .sort(); // Сортируем, чтобы инициализационные модули загружались первыми

        logger.info(`Найдено ${folders.length} модулей для загрузки`);
        
        // Загружаем каждый модуль последовательно
        for (const folder of folders) {
            const modulePath = path.join(modulesDir, folder, 'index.js');
            
            // Проверяем существование index.js в папке модуля
            if (!fs.existsSync(modulePath)) {
                logger.warn(`Модуль ${folder} не содержит index.js, пропускаем`);
                continue;
            }
            
            logger.debug(`Загрузка модуля: ${folder}`);
            
            try {
                // Динамически импортируем модуль
                const module = await import(modulePath);
                
                // Проверяем, имеет ли модуль метод initialize
                if (typeof module.initialize === 'function') {
                    await module.initialize();
                    logger.debug(`Модуль ${folder} инициализирован`);
                } else {
                    logger.warn(`Модуль ${folder} не имеет метода initialize`);
                }
            } catch (moduleError) {
                // Обработка ошибки с правильной типизацией
                const errorMessage = moduleError instanceof Error 
                    ? moduleError.message 
                    : String(moduleError);
                    
                logger.error(`Ошибка при загрузке модуля ${folder}: ${errorMessage}`);
            }
        }
        
        logger.info("Все модули загружены");
        return true;
    } catch (error) {
        // Обработка ошибки с правильной типизацией
        const errorMessage = error instanceof Error 
            ? error.message 
            : String(error);
            
        logger.error(`Ошибка при загрузке модулей: ${errorMessage}`);
        return false;
    }
}

// Основная функция запуска сервера
async function start() {
    logger.info("Запуск Matter to MQTT Bridge Server");
    
    // Загружаем модули
    const modulesLoaded = await loadModules();
    
    if (!modulesLoaded) {
        logger.error("Не удалось загрузить модули. Сервер останавливается.");
        process.exit(1);
    }
    
    // Здесь будет инициализация Matter сервера, когда мы добавим соответствующий модуль
    logger.info("Matter to MQTT Bridge Server успешно запущен");
}

// Запускаем сервер
start().catch(error => {
    const errorMessage = error instanceof Error 
        ? error.message 
        : String(error);
        
    logger.error(`Критическая ошибка при запуске сервера: ${errorMessage}`);
    process.exit(1);
});
