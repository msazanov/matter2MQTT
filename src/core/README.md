
# Module Loader

This component provides dynamic loading and unloading of Matter2MQTT modules at runtime.

## Purpose

- Dynamically load modules from the `dist/modules` directory.
- Manage module lifecycle (initialize and cleanup).
- Provide a unified inter-module communication interface.

---

## Module Structure

Each module must reside in its own directory under `dist/modules`, containing:

```
modules/
└── example-module
    ├── manifest.json
    └── index.ts
```

### Manifest Example

```json
{
  "id": "example-module",
  "name": "Example Module",
  "version": "1.0.0",
  "description": "An example module",
  "dependencies": [],
  "provides": ["example-service"],
  "tags": ["example"]
}
```

### index.ts Structure

```typescript
async function initialize(context: any): Promise<any> {
  // initialization logic
  return { api: {} };
}

async function cleanup(): Promise<void> {
  // cleanup logic
}

export default { initialize, cleanup };
```

---

## Module Loader API

| Method | Description | Parameters | Return |
|--------|-------------|------------|--------|
| `discoverAndLoadAllModules(initOptions)` | Dynamically discovers and loads all modules in the modules directory. | `initOptions: any` | `Promise<void>` |
| `loadModule(moduleId, initOptions)` | Loads an individual module. | `moduleId: string, initOptions: any` | `Promise<any>` |
| `unloadModule(moduleId)` | Unloads an individual module. | `moduleId: string` | `Promise<void>` |
| `unloadAllModules()` | Unloads all modules. | - | `Promise<void>` |
| `getApi(moduleId)` | Retrieves the public API of a module. | `moduleId: string` | `any` |

---

## Example Usage

### Dynamically Load Modules

Automatically discovers and loads all modules from `dist/modules`:

```typescript
await moduleLoader.discoverAndLoadAllModules({ configPath });
```

### Access API from Another Module

```typescript
const mqttApi = moduleLoader.getApi('mqtt');
mqttApi.publish('example/topic', 'Hello World');
```

---

## Development Notes

- Ensure each module implements `initialize()` and optionally `cleanup()`.
- Use manifests to declare dependencies explicitly.
- Avoid manual loading or unloading of specific modules from core files; always use dynamic loading.

