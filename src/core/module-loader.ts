import * as fs from 'fs-extra';
import path from 'path';
import { ModuleContext, ModuleInterface, ModuleManifest } from './types';
import { ConfigManager } from './config';
import { ConfigOptions } from './config/types';
import { logger } from './logger';

export class ModuleLoader {
  private modules: Map<string, any> = new Map();
  private modulesPath: string;
  private loadOrder: string[] = [];
  private api: { [moduleId: string]: any } = {};
  private configManager: ConfigManager;

  constructor(modulesPath = './dist/modules', options: ConfigOptions) {
    this.modulesPath = path.resolve(modulesPath);
    logger.info(`Module loader initialized with path: ${this.modulesPath}`, { context: 'Loader' });
    this.configManager = new ConfigManager(options);
  }

  async initialize(): Promise<void> {
    // Initialize config first
    await this.configManager.initialize();
    
    // Register config as a system module
    this.modules.set('config', {
      api: this.configManager.getAPI()
    });
  }

  getApi(moduleId: string): any {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found`);
    }
    return module.api;
  }

  async discoverAndLoadAllModules(): Promise<void> {
    // Config is already loaded as system module
    logger.info('Discovering and loading all modules', { context: 'Loader' });
    
    try {
      logger.debug(`Reading directory: ${this.modulesPath}`, { context: 'Loader' });
      const moduleDirs = await fs.readdir(this.modulesPath);
      logger.debug(`Found directories: ${moduleDirs.join(', ')}`, { context: 'Loader' });
      
      for (const moduleId of moduleDirs) {
        const modulePath = path.join(this.modulesPath, moduleId);
        const manifestPath = path.join(modulePath, 'manifest.json');
        
        logger.debug(`Checking module: ${moduleId}, manifest path: ${manifestPath}`, { context: 'Loader' });
        
        if (fs.existsSync(manifestPath)) {
          logger.info(`Found module: ${moduleId}`, { context: 'Loader' });
          await this.loadModule(moduleId);
        } else {
          logger.debug(`No manifest found for: ${moduleId}`, { context: 'Loader' });
        }
      }
      
      logger.info(`All modules loaded. Loaded modules: ${this.loadOrder.join(', ')}`, { context: 'Loader' });
    } catch (error) {
      logger.error(`Failed to discover modules: ${error instanceof Error ? error.message : String(error)}`, { context: 'Loader' });
      throw error;
    }
  }

  async loadModule(moduleId: string, initOptions: any = {}): Promise<any> {
    if (this.modules.has(moduleId)) {
      logger.debug(`Module ${moduleId} is already loaded`, { context: 'Loader' });
      return this.getModuleContext(moduleId);
    }

    logger.info(`Loading module ${moduleId}`, { context: 'Loader' });

    const modulePath = path.join(this.modulesPath, moduleId);
    const manifestPath = path.join(modulePath, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Module manifest not found: ${manifestPath}`);
    }

    const manifest: ModuleManifest = await fs.readJSON(manifestPath);
    const dependencyContexts: Record<string, any> = {};

    // Always include config module context since it's a system module
    dependencyContexts['config'] = {
      api: this.configManager.getAPI()
    };

    // Load other dependencies
    for (const depId of manifest.dependencies || []) {
      if (depId !== 'config' && !this.modules.has(depId)) {
        await this.loadModule(depId, initOptions);
      }
      if (depId !== 'config') {
        dependencyContexts[depId] = this.getModuleContext(depId);
      }
    }

    const moduleFile = path.join(modulePath, 'index.js');
    let moduleExport;
    try {
      moduleExport = await import(moduleFile);
    } catch {
      moduleExport = { default: require(moduleFile) };
    }

    if (!moduleExport.default || typeof moduleExport.default.initialize !== 'function') {
      throw new Error(`Module ${moduleId} does not export an initialize function`);
    }

    const moduleInitContext = {
      ...dependencyContexts,
      ...initOptions
    };

    const context = await moduleExport.default.initialize(moduleInitContext);

    const moduleInstance: ModuleInterface = {
      id: moduleId,
      manifest,
      context,
      initialize: moduleExport.default.initialize,
      cleanup: moduleExport.default.cleanup
    };

    this.modules.set(moduleId, moduleInstance);
    this.loadOrder.push(moduleId);

    if (context && context.api) {
      this.api[moduleId] = context.api;
    }

    logger.info(`Module ${moduleId} loaded successfully`, { context: 'Loader' });
    return context;
  }

  async unloadModule(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) {
      logger.debug(`Module ${moduleId} is not loaded`, { context: 'Loader' });
      return;
    }

    const dependentModules = Array.from(this.modules.values())
      .filter(m => m.manifest.dependencies && m.manifest.dependencies.includes(moduleId));

    if (dependentModules.length > 0) {
      const dependentIds = dependentModules.map(m => m.id).join(', ');
      throw new Error(`Cannot unload module ${moduleId} as it is required by: ${dependentIds}`);
    }

    logger.info(`Unloading module ${moduleId}`, { context: 'Loader' });

    if (module.cleanup && typeof module.cleanup === 'function') {
      await module.cleanup();
    }

    this.modules.delete(moduleId);
    this.loadOrder = this.loadOrder.filter(id => id !== moduleId);
    delete this.api[moduleId];

    logger.info(`Module ${moduleId} unloaded successfully`, { context: 'Loader' });
  }

  async unloadAllModules(): Promise<void> {
    // Unload modules in reverse order of loading
    const moduleIds = [...this.loadOrder].reverse();
    
    for (const moduleId of moduleIds) {
      const module = this.modules.get(moduleId);
      if (module && module.cleanup) {
        logger.info(`Cleaning up module ${moduleId}`, { context: 'Loader' });
        try {
          await module.cleanup();
        } catch (error) {
          logger.error(`Failed to cleanup module ${moduleId}: ${error instanceof Error ? error.message : String(error)}`, { context: 'Loader' });
        }
      }
    }
    
    this.modules.clear();
    this.loadOrder = [];
    this.api = {};
  }

  getModuleContext(moduleId: string): ModuleContext | null {
    const module = this.modules.get(moduleId);
    return module ? module.context : null;
  }

  getLoadedModuleIds(): string[] {
    return Array.from(this.modules.keys());
  }
}
