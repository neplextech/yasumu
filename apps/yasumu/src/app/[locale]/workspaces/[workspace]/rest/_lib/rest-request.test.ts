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
      isEventStream: false,
      events: [],
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

  it('maps headless REST event streams into the live-compatible response model', () => {
    const result = execution({
      status: 200,
      statusText: 'OK',
      headers: [
        ['content-type', 'application/json'],
        ['x-yasumu-original-content-type', 'text/event-stream'],
      ],
      body: { kind: 'json', value: { events: [] }, size: 13, truncated: false },
    });
    result.events = [{ id: '1', event: 'message', data: 'hello', receivedAt: 10 }];

    expect(restResponseFromExecution(result)).toMatchObject({
      isEventStream: true,
      streamConnected: false,
      events: result.events,
    });
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
    events: [],
  };
}
