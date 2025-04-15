import { ConfigService } from './services/config-service';
import { ConfigInitOptions, ConfigContext } from './types';

async function initialize(options: ConfigInitOptions): Promise<ConfigContext> {
  console.log('M2M:config: Initializing config module');

  const configService = new ConfigService(options.configPath);

  const context: ConfigContext = {
    api: {
      getConfig: (moduleId: string) => configService.getConfig(moduleId),
      setConfig: (moduleId: string, config: any) => configService.setConfig(moduleId, config),
      removeConfig: (moduleId: string) => configService.removeConfig(moduleId),
      reloadConfig: () => configService.reloadConfig(),
    }
  };

  console.log('M2M:config: Config module initialized');
  return context;
}

async function cleanup(): Promise<void> {
  console.log('M2M:config: Cleaning up config module');
}

export default { initialize, cleanup };