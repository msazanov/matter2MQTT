import * as fs from 'fs-extra';
import path from 'path';
import { Command } from 'commander';
import { ModuleLoader } from './core/module-loader';
import { logger } from './core/logger';

const program = new Command();

const packageJson = require('../package.json');
program
  .version(packageJson.version)
  .option('-c, --config <path>', 'Path to config file', './config/config.json')
  .option('-d, --debug', 'Enable debug logging')
  .parse(process.argv);

const options = program.opts();

if (options.debug) {
  process.env.DEBUG = 'true';
  logger.setLogLevel('debug');
  logger.info('Debug mode enabled');
}

const configPath = path.resolve(options.config);
logger.info(`Using config file: ${configPath}`);

const configDir = path.dirname(configPath);
fs.ensureDirSync(configDir);

export class Matter2MQTT {
  private moduleLoader: ModuleLoader;

  constructor(options: { configPath: string; modulesPath?: string }) {
    this.moduleLoader = new ModuleLoader(options.modulesPath, {
      configPath: options.configPath
    });
  }

  async start(): Promise<void> {
    await this.moduleLoader.initialize();
    await this.moduleLoader.discoverAndLoadAllModules();
  }

  async stop(): Promise<void> {
    await this.moduleLoader.unloadAllModules();
  }

  getApi(moduleId: string): any {
    return this.moduleLoader.getApi(moduleId);
  }
}

async function main() {
  try {
    logger.info('Starting Matter2MQTT Server');

    const matter2mqtt = new Matter2MQTT({ configPath });
    
    await matter2mqtt.start();

    // Универсальный обработчик завершения работы
    async function shutdown() {
      logger.info('Shutting down Matter2MQTT Server');
      try {
        await matter2mqtt.stop();
        logger.info('Matter2MQTT Server shutdown complete');
      } catch (error) {
        logger.error(`Error during shutdown: ${error}`);
      }
      process.exit(0);
    }

    process.on('SIGINT', () => {
      logger.info('Received SIGINT signal');
      shutdown();
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM signal');
      shutdown();
    });

    logger.info('Matter2MQTT Server started successfully');

  } catch (error: any) {
    logger.error(`Failed to start Matter2MQTT Server: ${error.message || error}`);
    logger.error('Stack trace:', { error: error.stack });
    process.exit(1);
  }
}

main();
