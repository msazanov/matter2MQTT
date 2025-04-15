import * as fs from 'fs-extra';
import path from 'path';
import { Command } from 'commander';
import { ModuleLoader } from './core/module-loader';

const program = new Command();

const log = {
  info: (message: string) => console.log(`M2M: ${message}`),
  error: (message: string) => console.error(`M2M ERROR: ${message}`),
  debug: (message: string) => process.env.DEBUG && console.log(`M2M DEBUG: ${message}`)
};

const packageJson = require('../package.json');
program
  .version(packageJson.version)
  .option('-c, --config <path>', 'Path to config file', './config/config.json')
  .option('-d, --debug', 'Enable debug logging')
  .parse(process.argv);

const options = program.opts();

if (options.debug) {
  process.env.DEBUG = 'true';
  log.info('Debug mode enabled');
}

const configPath = path.resolve(options.config);
log.info(`Using config file: ${configPath}`);

const configDir = path.dirname(configPath);
fs.ensureDirSync(configDir);

async function main() {
  try {
    log.info('Starting Matter2MQTT Server');

    const moduleLoader = new ModuleLoader();
    
    // Динамическое обнаружение и загрузка всех модулей из папки modules
    await moduleLoader.discoverAndLoadAllModules({ configPath });

    // Универсальный обработчик завершения работы
    async function shutdown() {
      log.info('Shutting down Matter2MQTT Server');
      // Сервер динамически выгружает ВСЕ модули
      await moduleLoader.unloadAllModules();
      process.exit(0);
    }

    process.on('SIGINT', () => {
      log.info('Received SIGINT signal');
      shutdown();
    });

    process.on('SIGTERM', () => {
      log.info('Received SIGTERM signal');
      shutdown();
    });

    log.info('Matter2MQTT Server started successfully');

  } catch (error: any) {
    log.error(`Failed to start Matter2MQTT Server: ${error.message || error}`);
    console.error(error);
    process.exit(1);
  }
}

main();
