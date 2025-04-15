# Matter2MQTT Server

Matter2MQTT is a modular server designed to bridge Matter-enabled IoT devices with MQTT brokers, providing seamless integration for smart home automation and IoT applications.

---

## Architecture

Matter2MQTT uses a dynamic modular architecture:

- The core server dynamically loads and manages independent modules.
- Each module is responsible for a specific functionality and provides APIs for inter-module communication.
- Modules are dynamically discovered and loaded from the `dist/modules` directory at server startup.
- No explicit module references are allowed within the core; modules are autonomous and interchangeable.

### Server Lifecycle

- **Startup**: Dynamically loads and initializes all modules.
- **Shutdown**: Dynamically unloads all modules and ensures clean resource release via module-specific cleanup logic.

---

## Module List

### ✅ Completed Modules

- **config**: Centralized configuration management module for other modules.
- **mqtt**: MQTT integration and internal messaging module.
- **logger**: Advanced logging and monitoring capabilities.

### 📌 Planned Modules

- **matter-controller**: Device control and state tracking.
- **device-registry**: Device discovery and registration.
- **commissioning**: Matter device commissioning and pairing.
- **database**: Persistent storage with SQLite and optional InfluxDB support.

---

## Developer Guide: Creating Modules

Modules must strictly follow this structure:

### File Structure

```
modules/
└── my-module
    ├── manifest.json
    ├── index.ts
    ├── types.ts (optional)
    └── services (optional)
        └── my-service.ts
```

### manifest.json

Every module must contain a `manifest.json`:

```json
{
  "id": "my-module",
  "name": "My Module",
  "version": "1.0.0",
  "description": "Brief description of what the module does",
  "dependencies": ["config", "mqtt", "logger"],
  "provides": ["my-service"],
  "tags": ["tag1", "tag2"]
}
```

### index.ts

The entry point of every module must export two async functions: `initialize()` and optionally `cleanup()`.

```typescript
async function initialize(context: any): Promise<any> {
  // Initialization logic here
  return { api: {} };
}

async function cleanup(): Promise<void> {
  // Cleanup logic here
}

export default { initialize, cleanup };
```

### Module Context

The `initialize()` function receives the context containing APIs of dependent modules:

```typescript
async function initialize({config, mqtt, logger}: any): Promise<any> {
  const configApi = config.api;
  const mqttApi = mqtt.api;
  const loggerApi = logger.api;

  // Use logger with automatic context detection
  loggerApi.info('Module initialized');

  mqttApi.subscribe('example/topic', (topic, message) => {
    loggerApi.debug(`Received message on ${topic}: ${message.toString()}`);
  });

  const myConfig = configApi.getConfig('my-module') || { key: 'default' };
  await configApi.setConfig('my-module', myConfig);

  return { api: {} };
}
```

### Inter-module Communication

Always use APIs provided by modules. Direct access to internal module logic or direct file operations are prohibited.

Example interaction:

```typescript
const mqttApi = context.mqtt.api;
mqttApi.publish('topic', 'message');
```

---

## Internal API Reference

### Module Loader API

| Method | Description |
|--------|-------------|
| `discoverAndLoadAllModules(initOptions)` | Dynamically loads all modules from modules directory. |
| `loadModule(moduleId, initOptions)` | Loads specified module. |
| `unloadModule(moduleId)` | Unloads specified module. |
| `unloadAllModules()` | Unloads all loaded modules. |
| `getApi(moduleId)` | Gets the public API of a specified module. |

### Config Module API

| Method | Description |
|--------|-------------|
| `getConfig(moduleId)` | Retrieves configuration for a module. |
| `setConfig(moduleId, config)` | Sets or updates configuration for a module. |
| `removeConfig(moduleId)` | Removes module configuration. |
| `reloadConfig()` | Reloads configuration from disk. |

### MQTT Module API

| Method | Description |
|--------|-------------|
| `publish(topic, message, retain)` | Publishes an MQTT message. |
| `subscribe(topic, handler)` | Subscribes to an MQTT topic. |
| `unsubscribe(topic)` | Unsubscribes from an MQTT topic. |

### Logger Module API

| Method | Description |
|--------|-------------|
| `debug(message, options?)` | Logs a debug message. |
| `info(message, options?)` | Logs an info message. |
| `warn(message, options?)` | Logs a warning message. |
| `error(message, options?)` | Logs an error message. |
| `setLogLevel(level)` | Sets the logging level. |

---

## Development Guidelines

- Modules must handle their own configuration via the provided `config` module.
- Modules must manage their own resource lifecycle.
- Modules must never be explicitly referenced in the core server logic; always use dynamic loading.
- Always use the logger module for logging; avoid direct console usage.
- Logger automatically detects module context from the call stack.

---

## How to Start Server

```bash
npm install
npm run build
npm start -- --debug
```

---

## Logging and Debugging

Use `--debug` flag to enable debug logging:

```bash
npm start -- --debug
```

Debug logging includes:
- All MQTT messages (published and received)
- Module lifecycle events
- Configuration changes
- Detailed error information

---

## Changelog

### v2.0.0
- Added automatic module context detection in logger
- Improved MQTT module logging
- Removed direct console usage in favor of logger module
- Added debug-level logging for all MQTT messages
- Enhanced error handling and reporting
- Updated module documentation

