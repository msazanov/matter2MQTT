export interface ModuleConfig {
    [key: string]: any;
  }
  
  export interface AppConfig {
    [moduleId: string]: ModuleConfig;
  }
  
  export interface ConfigInitOptions {
    configPath: string;
  }
  
  export interface ConfigAPI {
    getConfig(moduleId: string): ModuleConfig | undefined;
    setConfig(moduleId: string, config: ModuleConfig): Promise<void>;
    removeConfig(moduleId: string): Promise<void>;
    reloadConfig(): Promise<void>;
  }
  
  export interface ConfigContext {
    api: ConfigAPI;
  }
  