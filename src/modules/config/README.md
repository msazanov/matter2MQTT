
# Config Module

Centralized configuration manager for Matter2MQTT modules.

## Module Purpose
The `config` module provides a unified interface for managing configuration data across different modules.

---

## How to use this module in other modules

### Get module configuration:
```typescript
const configApi = moduleLoader.getApi('config');
const myModuleConfig = configApi.getConfig('myModule');
```

### Set or update module configuration:
```typescript
await configApi.setConfig('myModule', {
  param1: "value1",
  param2: "value2"
});
```

### Remove module configuration:
```typescript
await configApi.removeConfig('myModule');
```

### Reload entire configuration from disk:
```typescript
await configApi.reloadConfig();
```

---

## API Reference

| Method | Description | Parameters | Return |
|--------|-------------|------------|--------|
| `getConfig(moduleId)` | Retrieves configuration for the given module. | `moduleId: string` | `ModuleConfig \| undefined` |
| `setConfig(moduleId, config)` | Creates or updates configuration for a module and saves it to disk. | `moduleId: string`, `config: ModuleConfig` | `Promise<void>` |
| `removeConfig(moduleId)` | Removes a module's configuration from memory and saves changes to disk. | `moduleId: string` | `Promise<void>` |
| `reloadConfig()` | Reloads the entire configuration file from disk into memory. | - | `Promise<void>` |

---

## Example usage in a module (`mqtt`):

```typescript
async function initialize({config}: any): Promise<any> {
  const configApi = config.api;

  // Load existing config or create default
  let mqttConfig = configApi.getConfig('mqtt');
  if (!mqttConfig) {
    mqttConfig = {
      broker: 'mqtt://localhost',
      port: 1883
    };
    await configApi.setConfig('mqtt', mqttConfig);
  }

  // Update existing config
  mqttConfig.port = 1884;
  await configApi.setConfig('mqtt', mqttConfig);

  // Removing module config example
  await configApi.removeConfig('mqtt');

  // Reload all configs from file
  await configApi.reloadConfig();
}
```

---

## Configuration storage

Configurations are stored in JSON format at the specified path (`configPath` parameter) defined at server startup:

```json
{
  "mqtt": {
    "broker": "mqtt://localhost",
    "port": 1883
  },
  "otherModule": {
    "param": "value"
  }
}
```

---

## Development notes

- Always prefer using provided API methods over direct file manipulation.
- Configuration file is automatically created upon first run if it doesn't exist.
- Use `reloadConfig()` cautiously, as it reloads all configurations and may overwrite runtime changes.

