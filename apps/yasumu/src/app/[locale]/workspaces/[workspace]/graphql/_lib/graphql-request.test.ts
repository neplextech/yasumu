import type { ExecutionResult } from '@yasumu/core';
import { describe, expect, it } from 'vitest';

import { graphqlResponseFromExecution } from './graphql-request';

describe('graphqlResponseFromExecution', () => {
  it('maps structured GraphQL data, errors, and execution tests', () => {
    const result = execution({
      data: { viewer: null },
      errors: [{ message: 'Nope', locations: [{ line: 1, column: 2 }], path: ['viewer'] }],
    });
    result.tests = [{ test: 'viewer response', result: 'pass', error: null, duration: 2 }];
    const response = graphqlResponseFromExecution(result);

    expect(response).toMatchObject({
      status: 200,
      data: { viewer: null },
      errors: [{ message: 'Nope', locations: [{ line: 1, column: 2 }], path: ['viewer'] }],
      testResults: result.tests,
      time: 10,
    });
  });

  it('drops malformed GraphQL errors while preserving raw text', () => {
    const result = execution({ data: null, errors: [{ message: 42 }] });
    const response = graphqlResponseFromExecution(result);

    expect(response?.errors).toBeNull();
    expect(response?.rawBody).toBe('{"data":null,"errors":[{"message":42}]}');
  });

  it('returns null when execution has no response', () => {
    const result = execution({ data: null });
    result.response = undefined;
    expect(graphqlResponseFromExecution(result)).toBeNull();
  });
});

function execution(value: unknown): ExecutionResult {
  const text = JSON.stringify(value);
  return {
    executionId: 'execution',
    rootExecutionId: 'execution',
    entityId: 'graphql',
    entityKind: 'graphql',
    response: {
      status: 200,
      statusText: 'OK',
      headers: [['content-type', 'application/json']],
      body: { kind: 'json', value: value as never, size: text.length, truncated: false },
    },
    isMockResponse: false,
    status: 'completed',
    startedAt: 0,
    completedAt: 10,
    durationMs: 10,
    tests: [],
    logs: [],
    diagnostics: [],
    nestedExecutions: [],
  };
}
