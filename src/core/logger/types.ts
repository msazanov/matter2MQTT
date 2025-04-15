export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogOptions {
  timestamp?: boolean;
  colorize?: boolean;
  prefix?: string;
  error?: Error | string;
  context?: string;
}

export interface LoggerAPI {
  debug(message: string, options?: LogOptions): void;
  info(message: string, options?: LogOptions): void;
  warn(message: string, options?: LogOptions): void;
  error(message: string, options?: LogOptions): void;
  setLogLevel(level: LogLevel): void;
  getLogLevel(): LogLevel;
}

export interface LoggerConfig {
  level: LogLevel;
  colorize: boolean;
  timestamp: boolean;
  defaultPrefix: string;
} 