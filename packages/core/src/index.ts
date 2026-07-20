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
export * from './core/modules/email/email.js';
export * from './core/modules/execution/execution.js';
export * from './core/modules/cookies/cookies.js';
export * from './core/modules/graphql/graphql.entity.js';
export * from './core/modules/graphql/graphql.js';
export * from './core/modules/sse/sse.entity.js';
export * from './core/modules/sse/sse.js';
export * from './core/manager/environment-manager.js';
export * from './core/workspace/environment/environment.js';
export * from './core/workspace/environment/environment-variable.js';

// re-export
export * from '@yasumu/common';
export * from '@yasumu/rpc';
export type {
  ExecuteEntityInput,
  ExecutionEvent,
  ExecutionResult,
  CookieIngestionResult,
  CookieSameSite,
  SseEvent,
  YasumuFileReference,
  WorkspaceCookie,
  WorkspaceCookieInput,
} from '@yasumu/headless';
export { getSetCookieHeaders } from '@yasumu/headless';
