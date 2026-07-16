import type { ExecutionEvent, ExecutionResult } from '@yasumu/core';

export type RequestPhase =
  | 'idle'
  | 'pre-request-script'
  | 'sending'
  | 'post-response-script'
  | 'completed'
  | 'error'
  | 'cancelled';

export type ScriptOutputType = 'info' | 'success' | 'error' | 'warning' | 'test-pass' | 'test-fail' | 'test-skip';

export interface ScriptOutputEntry {
  message: string;
  type: ScriptOutputType;
  timestamp: number;
}

export function phaseFromExecutionEvent(event: ExecutionEvent, current: RequestPhase): RequestPhase {
  switch (event.type) {
    case 'hook-started':
      return event.hook === 'onRequest' ? 'pre-request-script' : 'post-response-script';
    case 'request-prepared':
    case 'request-sent':
      return 'sending';
    case 'execution-completed':
      return 'completed';
    case 'execution-cancelled':
      return 'cancelled';
    case 'execution-failed':
      return 'error';
    default:
      return current;
  }
}

export function outputFromExecutionEvent(event: ExecutionEvent): ScriptOutputEntry | null {
  switch (event.type) {
    case 'runtime-log':
      return {
        message: event.log.message,
        type: event.log.level === 'error' ? 'error' : event.log.level === 'warn' ? 'warning' : 'info',
        timestamp: event.timestamp,
      };
    case 'test-completed':
      return {
        message: `[Test] ${event.test.test}: ${event.test.result}`,
        type: event.test.result === 'pass' ? 'test-pass' : event.test.result === 'fail' ? 'test-fail' : 'test-skip',
        timestamp: event.timestamp,
      };
    case 'response-received':
      return event.mocked
        ? {
            message: '[Response] Script returned a mock; network transport was skipped',
            type: 'warning',
            timestamp: event.timestamp,
          }
        : null;
    default:
      return null;
  }
}

export function outputsFromExecution(result: ExecutionResult): ScriptOutputEntry[] {
  const output: ScriptOutputEntry[] = result.logs.map((log) => ({
    message: log.message,
    type: log.level === 'error' ? 'error' : log.level === 'warn' ? 'warning' : 'info',
    timestamp: log.timestamp,
  }));

  if (result.isMockResponse) {
    output.push({
      message: '[Response] Script returned a mock; network transport was skipped',
      type: 'warning',
      timestamp: result.completedAt,
    });
  }

  if (result.tests.length > 0) {
    const passed = result.tests.filter((test) => test.result === 'pass').length;
    const failed = result.tests.filter((test) => test.result === 'fail').length;
    const skipped = result.tests.filter((test) => test.result === 'skip').length;
    output.push({
      message: `[Test] ${passed} passed, ${failed} failed, ${skipped} skipped`,
      type: failed > 0 ? 'test-fail' : skipped > 0 && passed === 0 ? 'test-skip' : 'test-pass',
      timestamp: result.completedAt,
    });
  } else {
    output.push({ message: '[Test] No tests defined', type: 'info', timestamp: result.completedAt });
  }

  if (result.error) {
    output.push({ message: result.error.message, type: 'error', timestamp: result.completedAt });
  } else {
    output.push({
      message: `[Execution] Completed in ${Math.round(result.durationMs)} ms`,
      type: 'success',
      timestamp: result.completedAt,
    });
  }
  return output;
}
