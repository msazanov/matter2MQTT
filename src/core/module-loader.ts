import * as fs from 'fs-extra';
import path from 'path';
import { ModuleContext, ModuleInterface, ModuleManifest } from './types';

export class ModuleLoader {
  private modules: Map<string, ModuleInterface> = new Map();
  private modulesPath: string;
  private loadOrder: string[] = [];
  private api: { [moduleId: string]: any } = {};

  constructor(modulesPath = './dist/modules') {
    this.modulesPath = path.resolve(modulesPath);
    console.log(`M2M: Module loader initialized with path: ${this.modulesPath}`);
  }

  getApi(moduleId: string): any {
    return this.api[moduleId] || null;
  }

  async discoverAndLoadAllModules(initOptions: any = {}): Promise<void> {
    const moduleDirs = await fs.readdir(this.modulesPath);
    for (const moduleId of moduleDirs) {
      const moduleDirPath = path.join(this.modulesPath, moduleId);
      const manifestPath = path.join(moduleDirPath, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        await this.loadModule(moduleId, initOptions);
      }
    }
  }

  async loadModule(moduleId: string, initOptions: any = {}): Promise<any> {
    if (this.modules.has(moduleId)) {
      console.log(`M2M: Module ${moduleId} is already loaded`);
      return this.getModuleContext(moduleId);
    }

    console.log(`M2M: Loading module ${moduleId}`);

    const modulePath = path.join(this.modulesPath, moduleId);
    const manifestPath = path.join(modulePath, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Module manifest not found: ${manifestPath}`);
    }

    const manifest: ModuleManifest = await fs.readJSON(manifestPath);
    const dependencyContexts: Record<string, any> = {};

    for (const depId of manifest.dependencies || []) {
      if (!this.modules.has(depId)) {
        await this.loadModule(depId, initOptions);
      }
      dependencyContexts[depId] = this.getModuleContext(depId);
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

    console.log(`M2M: Module ${moduleId} loaded successfully`);
    return context;
  }

  async unloadModule(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) {
      console.log(`M2M: Module ${moduleId} is not loaded`);
      return;
    }

    const dependentModules = Array.from(this.modules.values())
      .filter(m => m.manifest.dependencies && m.manifest.dependencies.includes(moduleId));

    if (dependentModules.length > 0) {
      const dependentIds = dependentModules.map(m => m.id).join(', ');
      throw new Error(`Cannot unload module ${moduleId} as it is required by: ${dependentIds}`);
    }

    console.log(`M2M: Unloading module ${moduleId}`);

    if (module.cleanup && typeof module.cleanup === 'function') {
      await module.cleanup(); // <--- вызов без аргументов!
    }

    this.modules.delete(moduleId);
    this.loadOrder = this.loadOrder.filter(id => id !== moduleId);
    delete this.api[moduleId];

    console.log(`M2M: Module ${moduleId} unloaded successfully`);
  }

  async unloadAllModules(): Promise<void> {
    const unloadOrder = [...this.loadOrder].reverse();
    for (const moduleId of unloadOrder) {
      await this.unloadModule(moduleId);
    }
    console.log('M2M: All modules unloaded');
  }

  getModuleContext(moduleId: string): ModuleContext | null {
    const module = this.modules.get(moduleId);
    return module ? module.context : null;
  }

  getLoadedModuleIds(): string[] {
    return Array.from(this.modules.keys());
  }
}
