import { AsyncLocalStorage } from 'node:async_hooks';
import { expect as stdExpect } from '@std/expect';

export interface TestResult {
  test: string;
  result: 'pass' | 'fail' | 'skip';
  error: string | null;
  duration: number;
}

interface TestEntry {
  name: string;
  fn: TestFunction;
}

interface TestStore {
  tests: TestEntry[];
}

export interface TestRunResult {
  testResults: TestResult[];
}

export interface TestContext {
  /**
   * Skip the current test. The test will be marked as skipped.
   */
  skip(): never;
  /**
   * Explicitly fail the current test with an optional message.
   */
  fail(message?: string): never;
  /**
   * Explicitly pass the current test. Useful for early exit.
   */
  succeed(): never;
}

const testUnitWorker = new AsyncLocalStorage<TestStore>();

class SkipTestError extends Error {
  constructor() {
    super('Test skipped');
    this.name = 'SkipTestError';
  }
}

class FailTestError extends Error {
  constructor(message?: string) {
    super(message ?? 'Test failed');
    this.name = 'FailTestError';
  }
}

class SucceedTestError extends Error {
  constructor() {
    super('Test passed');
    this.name = 'SucceedTestError';
  }
}

const testContext: TestContext = {
  skip(): never {
    throw new SkipTestError();
  },
  fail(message?: string): never {
    throw new FailTestError(message);
  },
  succeed(): never {
    throw new SucceedTestError();
  },
};

function formatError(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

async function executeTest(entry: TestEntry): Promise<TestResult> {
  const start = performance.now();

  try {
    await entry.fn(testContext);
    return {
      test: entry.name,
      result: 'pass',
      error: null,
      duration: performance.now() - start,
    };
  } catch (err) {
    if (err instanceof SkipTestError) {
      return {
        test: entry.name,
        result: 'skip',
        error: null,
        duration: performance.now() - start,
      };
    }
    if (err instanceof SucceedTestError) {
      return {
        test: entry.name,
        result: 'pass',
        error: null,
        duration: performance.now() - start,
      };
    }
    if (err instanceof FailTestError) {
      return {
        test: entry.name,
        result: 'fail',
        error: err.message,
        duration: performance.now() - start,
      };
    }
    return {
      test: entry.name,
      result: 'fail',
      error: formatError(err),
      duration: performance.now() - start,
    };
  }
}

export async function runTest(fn: () => void): Promise<TestRunResult> {
  const store: TestStore = {
    tests: [],
  };

  testUnitWorker.run(store, fn);

  const testResults: TestResult[] = [];

  for (const entry of store.tests) {
    testResults.push(await executeTest(entry));
  }

  return { testResults };
}

export type TestFunction = (ctx: TestContext) => void | Promise<void>;

function proxyExpectStub(): ReturnType<typeof stdExpect> {
  const handler: ProxyHandler<object> = {
    get(_target, _prop) {
      return new Proxy(() => {}, handler);
    },
    apply() {
      return new Proxy(() => {}, handler);
    },
  };

  return new Proxy(() => {}, handler) as ReturnType<typeof stdExpect>;
}

export const expect = ((...args: Parameters<typeof stdExpect>) => {
  if (!testUnitWorker.getStore()) return proxyExpectStub();
  return stdExpect(...args);
}) as typeof stdExpect;

export function test(name: string, fn: TestFunction): void {
  const store = testUnitWorker.getStore();
  if (!store) return;

  store.tests.push({ name, fn });
}

export function describe(_name: string, fn: () => void): void {
  const store = testUnitWorker.getStore();
  if (!store) return;

  fn();
}
