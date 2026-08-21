import type { RestEntityData } from '@yasumu/core';
import { describe, expect, it } from 'vitest';

import { sseEntityCreateOptionsFromRest } from './rest-to-sse';

describe('sseEntityCreateOptionsFromRest', () => {
  it('copies the REST request into a reconnecting SSE request', () => {
    const rest = {
      id: 'rest-id',
      name: 'Notifications',
      method: 'GET',
      url: 'https://example.test/events',
      groupId: 'folder-id',
      requestHeaders: [{ key: 'Authorization', value: 'Bearer token', enabled: true }],
      requestParameters: [{ key: 'tenant', value: 'acme', enabled: true }],
      searchParameters: [{ key: 'topic', value: 'updates', enabled: true }],
      requestBody: null,
      script: { language: 'javascript', code: 'export function onRequest() {}' },
      testScript: { language: 'javascript', code: 'export function onTest() {}' },
      dependencies: ['shared-script'],
    } as RestEntityData;

    expect(sseEntityCreateOptionsFromRest(rest)).toEqual({
      name: 'Notifications (SSE)',
      method: 'GET',
      url: 'https://example.test/events',
      groupId: 'folder-id',
      requestHeaders: rest.requestHeaders,
      requestParameters: rest.requestParameters,
      searchParameters: rest.searchParameters,
      requestBody: null,
      script: rest.script,
      testScript: rest.testScript,
      dependencies: ['shared-script'],
      reconnect: { enabled: true, retryMs: 3000 },
      metadata: {},
    });
  });

  it('uses a readable fallback name for unnamed REST requests', () => {
    const rest = { name: '  ', method: 'POST', url: null } as RestEntityData;

    expect(sseEntityCreateOptionsFromRest(rest).name).toBe('New stream (SSE)');
  });
});
