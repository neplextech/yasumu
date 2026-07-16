import type { ExecutionResult } from '@yasumu/core';
import { describe, expect, it } from 'vitest';

import { restResponseFromExecution } from './rest-request';

describe('restResponseFromExecution', () => {
  it('maps text and JSON snapshots into the response-panel model', () => {
    const response = restResponseFromExecution(
      execution({
        status: 201,
        statusText: 'Created',
        headers: [
          ['content-type', 'application/json'],
          ['set-cookie', 'session=one'],
        ],
        body: { kind: 'json', value: { ok: true }, size: 11, truncated: false, contentType: 'application/json' },
      }),
    );

    expect(response).toMatchObject({
      status: 201,
      statusText: 'Created',
      time: 25,
      textBody: '{"ok":true}',
      binaryBody: null,
      bodyType: 'text',
      size: 11,
      cookies: ['session=one'],
    });
  });

  it('preserves binary bytes and truncation metadata', () => {
    const response = restResponseFromExecution(
      execution({
        status: 200,
        statusText: 'OK',
        headers: [['content-type', 'application/octet-stream']],
        body: { kind: 'binary', bytes: [1, 2, 3], size: 30, truncated: true },
      }),
    );

    expect(response?.bodyType).toBe('binary');
    expect(response?.bodyTruncated).toBe(true);
    expect([...new Uint8Array(response!.binaryBody!)]).toEqual([1, 2, 3]);
  });

  it('returns null when execution has no response', () => {
    expect(restResponseFromExecution(execution(undefined))).toBeNull();
  });
});

function execution(response: ExecutionResult['response']): ExecutionResult {
  return {
    executionId: 'execution',
    rootExecutionId: 'execution',
    entityId: 'rest',
    entityKind: 'rest',
    response,
    isMockResponse: false,
    status: 'completed',
    startedAt: 0,
    completedAt: 25,
    durationMs: 25,
    tests: [],
    logs: [],
    diagnostics: [],
    nestedExecutions: [],
  };
}
