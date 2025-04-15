# MQTT Module

The MQTT module provides MQTT integration and internal messaging capabilities for the Matter2MQTT server.

## Features

- MQTT broker connection management
- Topic subscription and message publishing
- Automatic reconnection handling
- Debug-level logging of all MQTT messages
- Bridge state tracking and reporting

## Configuration

The module can be configured through the config module:

```typescript
{
  "mqtt": {
    "broker": {
      "url": "mqtt://localhost:1883",
      "username": "user",
      "password": "pass"
    },
    "client": {
      "id": "matter2mqtt",
      "clean": true
    },
    "topics": {
      "prefix": "matter",
      "bridge": {
        "state": "bridge/state",
        "command": "bridge/command"
      }
    }
  }
}
```

## API

### MQTTService

| Method | Description |
|--------|-------------|
| `connect()` | Connects to the MQTT broker |
| `disconnect()` | Disconnects from the MQTT broker |
| `publish(topic, message, retain?)` | Publishes a message to a topic |
| `subscribe(topic, handler)` | Subscribes to a topic |
| `unsubscribe(topic)` | Unsubscribes from a topic |
| `isConnected()` | Returns the current connection state |

### Events

The MQTT service emits the following events:

- `connect`: Emitted when connected to the broker
- `disconnect`: Emitted when disconnected from the broker
- `message`: Emitted when a message is received
- `error`: Emitted when an error occurs

## Logging

The MQTT module uses the logger module with the prefix `M2M:mqtt`. Debug-level logging includes:

- Connection events
- Bridge state changes
- Message publishing and receiving
- Topic subscriptions and unsubscriptions

Example log output:
```
[M2M:mqtt] Connected to MQTT broker
[M2M:mqtt] Published: matter/bridge/state online
[M2M:mqtt] Received: matter/bridge/command {"type":"reset"}
```

## Usage Example

```typescript
const mqttApi = context.mqtt.api;

// Subscribe to a topic
mqttApi.subscribe('matter/bridge/command', (topic, message) => {
  // Handle message
});

// Publish a message
mqttApi.publish('matter/bridge/state', 'online');

// Check connection state
if (mqttApi.isConnected()) {
  // Do something
}
```

## Dependencies

- config: For module configuration
- logger: For logging and debugging

## Changelog

### v2.0.0
- Added debug-level logging for all MQTT messages
- Improved bridge state tracking and reporting
- Enhanced error handling and reporting
- Updated logging prefix to `M2M:mqtt`
- Removed direct console usage in favor of logger module

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

