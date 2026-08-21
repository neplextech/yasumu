import type { SubscriptionEventPayload } from '@yasumu/core';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isSubscriptionEventPayload(value: unknown): value is SubscriptionEventPayload {
  if (!isRecord(value) || !isRecord(value.data) || typeof value.data.workspaceId !== 'string') return false;

  return (
    value.event === 'execution-event' ||
    value.event === 'rest-entity-updated' ||
    value.event === 'graphql-entity-updated' ||
    value.event === 'sse-entity-updated' ||
    value.event === 'entity-history-updated'
  );
}
