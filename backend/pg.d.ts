// This file provides type definitions for pg
declare module 'pg' {
    export interface PoolConfig {
      user?: string;
      host?: string;
      database?: string;
      password?: string;
      port?: number;
      connectionString?: string;
      ssl?: boolean | any;
      max?: number;
      min?: number;
      idleTimeoutMillis?: number;
      connectionTimeoutMillis?: number;
    }
  
    export class Pool {
      constructor(config?: PoolConfig);
      connect(): Promise<any>;
      query(text: string, params?: any[]): Promise<any>;
      end(): Promise<void>;
    }
  }