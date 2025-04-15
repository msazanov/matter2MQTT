/**
 * src/core/types.ts
 * Core type definitions for the Matter2MQTT Server
 */

/**
 * Module manifest structure
 */
export interface ModuleManifest {
    id: string;
    name: string;
    version: string;
    description: string;
    dependencies?: string[];
    provides?: string[];
    tags?: string[];
  }
  
  /**
   * Module context provided to other modules
   */
  export interface ModuleContext {
    [key: string]: any;
    api?: any; // API exposed for inter-module communication
  }
  
  /**
   * Module instance
   */
  export interface ModuleInterface {
    id: string;
    manifest: ModuleManifest;
    context: ModuleContext;
    initialize: (context: any) => Promise<ModuleContext>;
    cleanup?: () => Promise<void>;
  }
  
  /**
   * Event handler type
   */
  export type EventHandler = (...args: any[]) => void;
  
  /**
   * Event API for communication between modules
   */
  export interface EventAPI {
    /**
     * Subscribe to an event
     */
    on(event: string, handler: EventHandler): void;
    
    /**
     * Unsubscribe from an event
     */
    off(event: string, handler: EventHandler): void;
    
    /**
     * Subscribe to an event one time
     */
    once(event: string, handler: EventHandler): void;
    
    /**
     * Emit an event
     */
    emit(event: string, ...args: any[]): void;
  }

export interface ModuleAPI {
  initialize?(): Promise<void>;
  cleanup?(): Promise<void>;
  get?(key: string): any;
  set?(key: string, value: any): void;
  delete?(key: string): void;
  has?(key: string): boolean;
  clear?(): void;
  api?: any;
}