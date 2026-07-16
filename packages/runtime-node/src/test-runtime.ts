import { AsyncLocalStorage } from 'node:async_hooks';

import { expect as standardExpect } from '@std/expect';
import type { TestResult } from '@yasumu/runtime-api';

import {
  currentExecution,
  type RegisteredTest,
  type TestControl,
  type TestRunState,
  workerError,
} from './execution-state.js';

const suiteStorage = new AsyncLocalStorage<string[]>();

class SkipTestError extends Error {}
class SucceedTestError extends Error {}
class FailTestError extends Error {}

const testControl: TestControl = {
  skip(): never {
    throw new SkipTestError('Test skipped');
  },
  fail(message?: string): never {
    throw new FailTestError(message ?? 'Test failed');
  },
  succeed(): never {
    throw new SucceedTestError('Test passed');
  },
};

export const expect = ((...args: Parameters<typeof standardExpect>) => {
  if (!currentExecution()?.testRun) return noOpExpectation();
  return standardExpect(...args);
}) as typeof standardExpect;

export function test(name: string, fn: RegisteredTest['fn']): void {
  const run = currentExecution()?.testRun;
  if (!run) return;
  run.tests.push({ name, suite: [...(suiteStorage.getStore() ?? [])], fn });
}

export function describe(name: string, fn: () => void | Promise<void>): void | Promise<void> {
  const run = currentExecution()?.testRun;
  if (!run) return;

  const suite = [...(suiteStorage.getStore() ?? []), name];
  const result = suiteStorage.run(suite, fn);
  if (!isPromiseLike(result)) return;

  const pending = Promise.resolve(result);
  pending.catch(() => undefined);
  run.pendingSuites.push(pending);
  return pending;
}

export async function executeRegisteredTests(run: TestRunState): Promise<TestResult[]> {
  await Promise.all(run.pendingSuites);
  const results: TestResult[] = [];
  for (const entry of run.tests) results.push(await executeTest(entry));
  return results;
}

async function executeTest(entry: RegisteredTest): Promise<TestResult> {
  const startedAt = performance.now();
  try {
    await entry.fn(testControl);
    return result(entry, 'pass', null, startedAt);
  } catch (error) {
    if (error instanceof SkipTestError) return result(entry, 'skip', null, startedAt);
    if (error instanceof SucceedTestError) return result(entry, 'pass', null, startedAt);
    if (error instanceof FailTestError) return result(entry, 'fail', error.message, startedAt);
    return result(entry, 'fail', error instanceof Error ? error.message : String(error), startedAt);
  }
}

function result(
  entry: RegisteredTest,
  status: TestResult['result'],
  error: string | null,
  startedAt: number,
): TestResult {
  return {
    suite: entry.suite.length > 0 ? entry.suite : undefined,
    test: entry.name,
    result: status,
    error,
    duration: performance.now() - startedAt,
  };
}

function noOpExpectation(): ReturnType<typeof standardExpect> {
  const handler: ProxyHandler<() => void> = {
    get() {
      return new Proxy(() => undefined, handler);
    },
    apply() {
      return new Proxy(() => undefined, handler);
    },
  };
  return new Proxy(() => undefined, handler) as unknown as ReturnType<typeof standardExpect>;
}

function isPromiseLike(value: void | Promise<void>): value is Promise<void> {
  return typeof value === 'object' && value !== null && 'then' in value;
}

export function assertTestRun(run: TestRunState | undefined): TestRunState {
  if (!run) throw workerError('SCRIPT_TEST_CONTEXT_UNAVAILABLE', 'Tests can only be registered from onTest');
  return run;
}
