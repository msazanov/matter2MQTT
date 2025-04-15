import * as fs from 'fs-extra';
import path from 'path';
import { AppConfig, ConfigAPI, ModuleConfig } from '../types';

export class ConfigService implements ConfigAPI {
  private configPath: string;
  private config: AppConfig;

  constructor(configPath: string) {
    this.configPath = path.resolve(configPath);
    this.config = this.loadConfig();
  }

  getConfig(moduleId: string): ModuleConfig | undefined {
    return this.config[moduleId];
  }

  async setConfig(moduleId: string, moduleConfig: ModuleConfig): Promise<void> {
    this.config[moduleId] = moduleConfig;
    await this.saveConfig();
  }

  async removeConfig(moduleId: string): Promise<void> {
    delete this.config[moduleId];
    await this.saveConfig();
  }

  async reloadConfig(): Promise<void> {
    this.config = this.loadConfig();
  }

  private async saveConfig(): Promise<void> {
    await fs.ensureDir(path.dirname(this.configPath));
    await fs.writeJson(this.configPath, this.config, { spaces: 2 });
    console.log(`M2M:config: Configuration saved to ${this.configPath}`);
  }

  private loadConfig(): AppConfig {
    if (!fs.existsSync(this.configPath)) {
      console.log(`M2M:config: No existing configuration found. Creating empty config.`);
      this.saveConfig();
      return {};
    }
    try {
      console.log(`M2M:config: Loading configuration from ${this.configPath}`);
      return fs.readJsonSync(this.configPath);
    } catch (error) {
      console.error(`M2M:config ERROR: Failed to load config, creating empty config.`);
      this.saveConfig();
      return {};
    }
  }
}
