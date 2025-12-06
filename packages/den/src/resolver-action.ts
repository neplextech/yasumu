import { RESOLVER_METADATA } from './constants.js';
import type { RpcHandlerMetadata } from './interfaces.js';

export function Resolver(namespace?: string): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(RESOLVER_METADATA.NAMESPACE, namespace, target);
  };
}

function createRpcDecorator(type: 'query' | 'mutation', name?: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const handlers =
      Reflect.getMetadata(RESOLVER_METADATA.HANDLERS, target.constructor) || {};

    const metadata: RpcHandlerMetadata = {
      type,
      handler: descriptor.value,
      methodName: propertyKey,
      rpcName: name,
    };

    handlers[propertyKey] = metadata;

    Reflect.defineMetadata(
      RESOLVER_METADATA.HANDLERS,
      handlers,
      target.constructor,
    );
  };
}

export function Query(name?: string) {
  return createRpcDecorator('query', name);
}

export function Mutation(name?: string) {
  return createRpcDecorator('mutation', name);
}
