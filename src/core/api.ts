import { ModuleAPI } from './types';
import { logger } from './logger';

const moduleApis: Map<string, ModuleAPI> = new Map();

// Register logger as a system module
moduleApis.set('logger', { api: logger });

export function getApi<T extends ModuleAPI>(moduleId: string): T {
  const api = moduleApis.get(moduleId);
  if (!api) {
    throw new Error(`Module API not found: ${moduleId}`);
  }
  return api as T;
}

export function registerApi(moduleId: string, api: ModuleAPI): void {
  moduleApis.set(moduleId, api);
}

export function unregisterApi(moduleId: string): void {
  moduleApis.delete(moduleId);
} 