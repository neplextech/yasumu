import {
  INJECTABLE_METADATA,
  INJECT_METADATA,
  OPTIONAL_METADATA,
} from '../constants.js';
import type { Token, InjectableOptions } from './types.js';

export function Injectable(options?: InjectableOptions): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(INJECTABLE_METADATA, options || {}, target);
  };
}

export function Inject(token: Token): ParameterDecorator & PropertyDecorator {
  return ((
    target: Object,
    propertyKey: string | symbol | undefined,
    parameterIndex?: number,
  ) => {
    if (typeof parameterIndex === 'number') {
      // Constructor parameter or Method parameter
      // If propertyKey is undefined, it's constructor

      // We only support constructor injection for now easily in the container
      if (!propertyKey) {
        const params = Reflect.getMetadata(INJECT_METADATA, target) || {};
        params[parameterIndex] = token;
        Reflect.defineMetadata(INJECT_METADATA, params, target);
      }
    }
  }) as any;
}

export function Optional(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    if (typeof parameterIndex === 'number') {
      // Constructor injection
      if (!propertyKey) {
        const optionals = Reflect.getMetadata(OPTIONAL_METADATA, target) || {};
        optionals[parameterIndex] = true;
        Reflect.defineMetadata(OPTIONAL_METADATA, optionals, target);
      }
    }
  };
}
