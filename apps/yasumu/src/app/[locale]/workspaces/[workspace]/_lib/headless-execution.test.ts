import type { ExecutionResult } from '@yasumu/core';
import { describe, expect, it } from 'vitest';

import { outputFromExecutionEvent, outputsFromExecution, phaseFromExecutionEvent } from './headless-execution';

const base = {
  executionId: 'execution',
  workspaceId: 'workspace',
  entityId: 'entity',
  timestamp: 10,
};

describe('headless execution UI mapping', () => {
  it('maps backend lifecycle events to the existing request phases', () => {
    expect(
      phaseFromExecutionEvent({ ...base, type: 'hook-started', hook: 'onRequest', sourceId: 'script' }, 'idle'),
    ).toBe('pre-request-script');
    expect(phaseFromExecutionEvent({ ...base, type: 'request-sent' }, 'pre-request-script')).toBe('sending');
    expect(
      phaseFromExecutionEvent({ ...base, type: 'hook-started', hook: 'onResponse', sourceId: 'script' }, 'sending'),
    ).toBe('post-response-script');
    expect(phaseFromExecutionEvent({ ...base, type: 'execution-cancelled' }, 'sending')).toBe('cancelled');
  });

  it('maps logs, tests, and mock events without renderer-side execution logic', () => {
    const log = outputFromExecutionEvent({
      ...base,
      type: 'runtime-log',
      log: { level: 'warn', message: 'slow response', timestamp: 10 },
    });
    const test = outputFromExecutionEvent({
      ...base,
      type: 'test-completed',
      test: { test: 'status', result: 'pass', error: null, duration: 1 },
    });
    const mocked = outputFromExecutionEvent({ ...base, type: 'response-received', status: 200, mocked: true });

    expect(log).toMatchObject({ type: 'warning', message: 'slow response' });
    expect(test).toMatchObject({ type: 'test-pass', message: '[Test] status: pass' });
    expect(mocked?.message).toContain('network transport was skipped');
  });

  it('builds the final console summary from the serializable result', () => {
    const result: ExecutionResult = {
      executionId: 'execution',
      rootExecutionId: 'execution',
      entityId: 'entity',
      entityKind: 'rest',
      isMockResponse: true,
      status: 'completed',
      startedAt: 0,
      completedAt: 25,
      durationMs: 25,
      tests: [{ test: 'status', result: 'pass', error: null, duration: 1 }],
      logs: [{ level: 'info', message: 'hook log', timestamp: 12 }],
      diagnostics: [],
      nestedExecutions: [],
      events: [],
    };

    expect(outputsFromExecution(result).map((entry) => entry.type)).toEqual([
      'info',
      'warning',
      'test-pass',
      'success',
    ]);
  });
});
