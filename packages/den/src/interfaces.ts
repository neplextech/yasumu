import type { Type } from './types.js';

export type { Type };

export interface ModuleOptions {
  imports?: Array<Type<any> | DynamicModule>;
  providers?: Type<any>[];
  resolvers?: Type<any>[];
  exports?: Array<Type<any> | DynamicModule>;
}

export interface DynamicModule extends ModuleOptions {
  module: Type<any>;
  global?: boolean;
}

export interface OnModuleInit {
  onModuleInit(): any;
}

export interface OnApplicationBootstrap {
  onApplicationBootstrap(): any;
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
