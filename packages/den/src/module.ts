import type { ModuleOptions } from './interfaces.js';
import { MODULE_METADATA } from './constants.js';

export function Module(options: ModuleOptions): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(
      MODULE_METADATA.IMPORTS,
      options.imports || [],
      target,
    );
    Reflect.defineMetadata(
      MODULE_METADATA.PROVIDERS,
      options.providers || [],
      target,
    );
    Reflect.defineMetadata(
      MODULE_METADATA.RESOLVERS,
      options.resolvers || [],
      target,
    );
    Reflect.defineMetadata(
      MODULE_METADATA.EXPORTS,
      options.exports || [],
      target,
    );
  };
}

export function Global(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(MODULE_METADATA.GLOBAL, true, target);
  };
}
