import type { Type } from './types.js';
import type { Provider, Token } from './di/types.js';

export type { Type, Token };

export interface ModuleOptions {
  imports?: Array<Type<any> | DynamicModule>;
  providers?: Provider[];
  resolvers?: Type<any>[];
  exports?: Array<Token<any> | DynamicModule | Provider>;
}

export interface DynamicModule extends ModuleOptions {
  module: Type<any>;
  global?: boolean;
}

export interface OnModuleInit {
  onModuleInit(): any;
}

export interface OnModuleDestroy {
  onModuleDestroy(): any;
}

export interface OnApplicationBootstrap {
  onApplicationBootstrap(): any;
}

export interface OnApplicationShutdown {
  onApplicationShutdown(signal?: string): any;
}

export interface RpcRequest {
  action: string;
  type?: 'query' | 'mutation';
  payload?: any;
}

export interface DenApplication {
  execute(request: RpcRequest, context?: any): Promise<any>;
  close(): Promise<void>;
}

export interface RpcHandlerMetadata {
  type: 'query' | 'mutation';
  handler: Function;
  methodName: string;
  rpcName?: string;
}
