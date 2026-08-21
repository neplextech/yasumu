import type { RestEntityData, SseEntityCreateOptions } from '@yasumu/core';

export function sseEntityCreateOptionsFromRest(entity: RestEntityData): SseEntityCreateOptions {
  const name = entity.name?.trim() || 'New stream';

  return {
    name: `${name} (SSE)`,
    method: entity.method,
    url: entity.url,
    groupId: entity.groupId,
    requestHeaders: entity.requestHeaders,
    requestParameters: entity.requestParameters,
    searchParameters: entity.searchParameters,
    requestBody: entity.requestBody,
    script: entity.script,
    testScript: entity.testScript,
    dependencies: entity.dependencies,
    reconnect: { enabled: true, retryMs: 3000 },
    metadata: {},
  };
}
