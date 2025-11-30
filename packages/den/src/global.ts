import { MODULE_METADATA } from './constants.js';

export function Global(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(MODULE_METADATA.GLOBAL, true, target);
  };
}
