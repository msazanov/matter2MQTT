
# MQTT Module

Provides MQTT connectivity and messaging API for Matter2MQTT modules.

## Purpose

- Connect to an MQTT broker.
- Provide inter-module messaging via MQTT.
- Automatically handle connection lifecycle (online/offline).

---

## Module Structure

```
modules/
└── mqtt
    ├── manifest.json
    ├── index.ts
    ├── types.ts
    └── services
        └── mqtt-service.ts
```

---

## Internal MQTT API

Other modules use MQTT via the provided internal API:

### Publish Message

```typescript
mqttApi.publish('some/topic', 'Hello World');
```

### Subscribe to Topic

```typescript
mqttApi.subscribe('some/topic', (topic, message) => {
  console.log(`Message on ${topic}: ${message.toString()}`);
});
```

### Unsubscribe from Topic

```typescript
mqttApi.unsubscribe('some/topic');
```

---

## Configuration

The module manages its configuration dynamically via the `config` module. Default configuration:

```json
{
  "mqtt": {
    "broker": "mqtt://localhost",
    "port": 1883,
    "username": "",
    "password": "",
    "clientId": "matter2mqtt",
    "topicPrefix": "matter/"
  }
}
```

The configuration is automatically created on the first start if it doesn't exist.

---

## Lifecycle

The module automatically handles MQTT connection lifecycle:

- Publishes `matter/bridge/state: online` upon successful connection.
- Publishes `matter/bridge/state: offline` before disconnecting.

---

## Example Usage from Another Module

```typescript
async function initialize({mqtt}: any): Promise<any> {
  mqtt.api.subscribe('matter/device/command', (topic, message) => {
    console.log(`Command received: ${message.toString()}`);
  });

  mqtt.api.publish('matter/device/state', 'ready');
}
```

---

## Development Notes

- MQTT module depends on the config module.
- Always use provided API methods; avoid direct interaction with MQTT client.
- Properly handle subscriptions by unsubscribing when no longer needed.

