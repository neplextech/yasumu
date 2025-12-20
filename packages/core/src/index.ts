import { Yasumu, type YasumuOptions } from './yasumu.js';

/**
 * Creates a new Yasumu instance.
 * @param options - The options for the Yasumu instance.
 * @returns A new Yasumu instance.
 */
export function createYasumu(options: YasumuOptions): Yasumu {
  return new Yasumu(options);
}

export * from './yasumu.js';
export * from './events/common.js';
export * from './events/event-bus.js';
export * from './core/manager/workspace-manager.js';
export * from './core/workspace/workspace.js';
export * from './core/modules/rest/rest.entity.js';
export * from './core/modules/rest/rest.js';

// re-export
export * from '@yasumu/common';
export * from '@yasumu/rpc';
