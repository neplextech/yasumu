import { expect as stdExpect } from '@std/expect';

export interface TestResult {
  suite?: string[];
  test: string;
  result: 'pass' | 'fail' | 'skip';
  error: string | null;
  duration: number;
}

interface TestEntry {
  name: string;
  suite: string[];
  fn: TestFunction;
}

interface TestStore {
  tests: TestEntry[];
  pendingSuites: Promise<void>[];
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

let activeTestStore: TestStore | undefined;
let activeTestSuite: string[] = [];

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
      suite: entry.suite.length > 0 ? entry.suite : undefined,
      test: entry.name,
      result: 'pass',
      error: null,
      duration: performance.now() - start,
    };
  } catch (err) {
    if (err instanceof SkipTestError) {
      return {
        suite: entry.suite.length > 0 ? entry.suite : undefined,
        test: entry.name,
        result: 'skip',
        error: null,
        duration: performance.now() - start,
      };
    }
    if (err instanceof SucceedTestError) {
      return {
        suite: entry.suite.length > 0 ? entry.suite : undefined,
        test: entry.name,
        result: 'pass',
        error: null,
        duration: performance.now() - start,
      };
    }
    if (err instanceof FailTestError) {
      return {
        suite: entry.suite.length > 0 ? entry.suite : undefined,
        test: entry.name,
        result: 'fail',
        error: err.message,
        duration: performance.now() - start,
      };
    }
    return {
      suite: entry.suite.length > 0 ? entry.suite : undefined,
      test: entry.name,
      result: 'fail',
      error: formatError(err),
      duration: performance.now() - start,
    };
  }
}

export async function runTest(fn: () => void | Promise<void>): Promise<TestRunResult> {
  const store: TestStore = {
    tests: [],
    pendingSuites: [],
  };

  const previousStore = activeTestStore;
  const previousSuite = activeTestSuite;
  activeTestStore = store;
  activeTestSuite = [];

  try {
    await fn();
    await Promise.all(store.pendingSuites);

    const testResults: TestResult[] = [];
    for (const entry of store.tests) {
      testResults.push(await executeTest(entry));
    }
    return { testResults };
  } finally {
    activeTestStore = previousStore;
    activeTestSuite = previousSuite;
  }
}

export type TestFunction = (ctx: TestContext) => void | Promise<void>;

function proxyExpectStub(): ReturnType<typeof stdExpect> {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'then') return undefined;
      return new Proxy(() => {}, handler);
    },
    apply() {
      return new Proxy(() => {}, handler);
    },
  };

  return new Proxy(() => {}, handler) as ReturnType<typeof stdExpect>;
}

export const expect = ((...args: Parameters<typeof stdExpect>) => {
  if (!activeTestStore) return proxyExpectStub();
  return stdExpect(...args);
}) as typeof stdExpect;

export function test(name: string, fn: TestFunction): void {
  const store = activeTestStore;
  if (!store) return;

  store.tests.push({
    name,
    suite: [...activeTestSuite],
    fn,
  });
}

export function describe(name: string, fn: () => void | Promise<void>): void | Promise<void> {
  const store = activeTestStore;
  if (!store) return;

  const parentSuite = activeTestSuite;
  activeTestSuite = [...parentSuite, name];

  let result: void | Promise<void>;
  try {
    result = fn();
  } catch (error) {
    activeTestSuite = parentSuite;
    throw error;
  }
  if (!isPromiseLike(result)) {
    activeTestSuite = parentSuite;
    return;
  }

  const pending = Promise.resolve(result).finally(() => {
    activeTestSuite = parentSuite;
  });
  pending.catch(() => undefined);
  store.pendingSuites.push(pending);
  return pending;
}

function isPromiseLike(value: void | Promise<void>): value is Promise<void> {
  return typeof value === 'object' && value !== null && 'then' in value;
}
