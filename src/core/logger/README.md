# Logger Module

The logger module provides a unified logging interface for the Matter2MQTT server and its modules.

## Usage

### In Core Files

For core files like `matter2mqtt.ts` and `module-loader.ts`, use the logger directly:

```typescript
import { logger } from '../core/logger';

// For module-loader.ts, specify the context
logger.info('Some message', { context: 'Loader' });

// For matter2mqtt.ts, no context needed as it will be detected automatically
logger.info('Some message');
```

### In Modules

For modules, use the `createLogger` function to get a logger with the correct context:

```typescript
import { createLogger } from '../../core/logger';

// Create a logger with the module's context
const logger = createLogger('my-module');

// Use the logger
logger.info('Module initialized');
logger.error('An error occurred', { error: new Error('Something went wrong') });
```

Alternatively, you can use the context option directly:

```typescript
import { logger } from '../../core/logger';

// Use the logger with the module's context
logger.info('Module initialized', { context: 'my-module' });
logger.error('An error occurred', { error: new Error('Something went wrong'), context: 'my-module' });
```

## Log Levels

The logger supports the following log levels:

- `debug`: Detailed information for debugging
- `info`: General information about the application's progress
- `warn`: Warnings that don't prevent the application from working
- `error`: Errors that prevent the application from working correctly

## Log Options

The logger accepts the following options:

- `timestamp`: Whether to include a timestamp in the log message (default: from config)
- `colorize`: Whether to colorize the log message (default: from config)
- `prefix`: Explicit prefix to use (overrides automatic detection)
- `error`: Error object or string to include in the log message
- `context`: Context to use for the log message (e.g., module name)

## Configuration

The logger can be configured using the `setConfig` method:

```typescript
import { logger } from '../core/logger';

logger.setConfig({
  level: 'debug',
  colorize: true,
  timestamp: true,
  defaultPrefix: 'M2M'
});
``` 