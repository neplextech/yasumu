import { describe, expect, it } from 'vitest';

import { isSubscriptionEventPayload } from './tanxium-event-guards';

describe('isSubscriptionEventPayload', () => {
  it('accepts execution lifecycle events', () => {
    expect(
      isSubscriptionEventPayload({
        event: 'execution-event',
        data: { type: 'sse-opened', workspaceId: 'workspace-1' },
      }),
    ).toBe(true);
  });

  it('accepts all workspace subscription event families', () => {
    for (const event of [
      'rest-entity-updated',
      'graphql-entity-updated',
      'sse-entity-updated',
      'entity-history-updated',
    ]) {
      expect(isSubscriptionEventPayload({ event, data: { workspaceId: 'workspace-1' } })).toBe(true);
    }
  });

  it('rejects unknown events and malformed workspace payloads', () => {
    expect(isSubscriptionEventPayload({ event: 'new-email', data: { workspaceId: 'workspace-1' } })).toBe(false);
    expect(isSubscriptionEventPayload({ event: 'execution-event', data: {} })).toBe(false);
    expect(isSubscriptionEventPayload(null)).toBe(false);
  });
});
