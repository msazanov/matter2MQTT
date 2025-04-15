import { LoggerAPI, LogLevel, LogOptions, LoggerConfig } from './types';
import { defaultConfig } from './config';

const colors = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m'   // Reset
};

class Logger implements LoggerAPI {
  private level: LogLevel = defaultConfig.level;
  private config: { [key: string]: any } = {};

  constructor() {
    // Initialize with default config
    this.config = { ...defaultConfig };
  }

  private getSourcePrefix(options?: LogOptions): string {
    // If prefix is explicitly provided, use it
    if (options?.prefix) {
      return options.prefix;
    }
    
    // If context is provided, use it to create the prefix
    if (options?.context) {
      return `M2M:${options.context}`;
    }

    // Get the default prefix from config
    const defaultPrefix = this.config.defaultPrefix || 'M2M';
    
    // Try to determine the source from the call stack
    try {
      const stack = new Error().stack || '';
      const stackLines = stack.split('\n');
      
      // Skip the first few lines (Error, Logger methods)
      for (let i = 3; i < stackLines.length; i++) {
        const line = stackLines[i];
        
        // Ignore CommonJS loader lines
        if (line.includes('cjs/loader.js') || line.includes('internal/modules/cjs/loader.js')) {
          continue;
        }
        
        // Check if the call is from matter2mqtt.ts or matter2mqtt.js
        if (line.includes('matter2mqtt.ts') || line.includes('matter2mqtt.js')) {
          return 'M2M';
        }
        
        // Check if the call is from module-loader.ts
        if (line.includes('module-loader.ts')) {
          return 'M2M:Loader';
        }
        
        // Check if the call is from a module
        // Look for paths containing /modules/ followed by a module name
        const moduleMatch = line.match(/\/modules\/([^/]+)\//);
        if (moduleMatch && moduleMatch[1]) {
          return `M2M:${moduleMatch[1]}`;
        }
        
        // Alternative pattern for compiled code
        const compiledModuleMatch = line.match(/dist\/modules\/([^/]+)\//);
        if (compiledModuleMatch && compiledModuleMatch[1]) {
          return `M2M:${compiledModuleMatch[1]}`;
        }
        
        // Check for module name in the path without the /modules/ prefix
        // This helps with compiled code where the path structure might be different
        const pathModuleMatch = line.match(/\/([^/]+)\/index\.(js|ts)/);
        if (pathModuleMatch && pathModuleMatch[1] && 
            !['matter2mqtt', 'module-loader', 'logger', 'config'].includes(pathModuleMatch[1])) {
          return `M2M:${pathModuleMatch[1]}`;
        }
      }
    } catch (e) {
      // If stack trace analysis fails, fall back to default
    }
    
    return defaultPrefix;
  }

  private formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
    const timestamp = options?.timestamp ?? this.config.timestamp
      ? `[${new Date().toISOString()}]`
      : '';
    
    const prefix = this.getSourcePrefix(options);
    const colorize = options?.colorize ?? this.config.colorize;
    
    const color = colorize ? colors[level] : '';
    const reset = colorize ? colors.reset : '';
    
    let formattedMessage = `${timestamp} ${color}[${level.toUpperCase()}]${reset} [${prefix}] ${message}`;
    
    if (options?.error) {
      const error = options.error instanceof Error ? options.error.stack : options.error;
      formattedMessage += `\n${error}`;
    }
    
    return formattedMessage;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  debug(message: string, options?: LogOptions): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, options));
    }
  }

  info(message: string, options?: LogOptions): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, options));
    }
  }

  warn(message: string, options?: LogOptions): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, options));
    }
  }

  error(message: string, options?: LogOptions): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, options));
    }
  }

  setLogLevel(level: LogLevel): void {
    this.level = level;
    this.config.level = level;
  }

  getLogLevel(): LogLevel {
    return this.level;
  }

  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.level) {
      this.level = config.level;
    }
  }
}

// Create singleton instance
export const logger = new Logger();

/**
 * Creates a logger with the specified context.
 * This is useful for modules to get a logger with the correct prefix.
 * @param context The context to use for the logger (e.g., module name)
 * @returns A logger with the specified context
 */
export function createLogger(context: string): LoggerAPI {
  return {
    debug: (message: string, options?: LogOptions) => {
      logger.debug(message, { ...options, context });
    },
    info: (message: string, options?: LogOptions) => {
      logger.info(message, { ...options, context });
    },
    warn: (message: string, options?: LogOptions) => {
      logger.warn(message, { ...options, context });
    },
    error: (message: string, options?: LogOptions) => {
      logger.error(message, { ...options, context });
    },
    setLogLevel: (level: LogLevel) => {
      logger.setLogLevel(level);
    },
    getLogLevel: () => {
      return logger.getLogLevel();
    }
  };
}

// Export initialize and cleanup functions
export async function initialize(): Promise<void> {
  // Logger is initialized with default config
  // Additional config can be set via setConfig method
}

export function cleanup(): void {
  // No cleanup needed
} 