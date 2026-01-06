# `@yasumu/test`

A lightweight testing framework designed for Yasumu scripts with a synchronous API and async execution.

## Usage

```typescript
import { runTest, test, expect, describe } from '@yasumu/test';

const results = await runTest(() => {
  test('addition works', () => {
    expect(1 + 1).toBe(2);
  });

  test('async operations', async () => {
    const data = await fetchSomething();
    expect(data).toBeDefined();
  });

  test('conditional skip', (ctx) => {
    if (someCondition) {
      ctx.skip();
    }

    expect(true).toBe(true);
  });

  test('explicit fail', (ctx) => {
    if (!isValid) {
      ctx.fail('Validation failed');
    }
  });

  test('early success', (ctx) => {
    if (optionalFieldMissing) {
      ctx.succeed();
    }

    expect(optionalField).toBeDefined();
  });

  describe('grouped tests', () => {
    test('nested test', () => {
      expect('hello').toContain('ell');
    });
  });
});

console.log(results.testResults);
```

## API

### `runTest(fn)`

Executes all tests defined within the callback function.

- **fn**: `() => void` - Synchronous function containing test definitions
- **Returns**: `Promise<TestRunResult>` - Results of all tests

### `test(name, fn)`

Defines a test case.

- **name**: `string` - Test name
- **fn**: `(ctx: TestContext) => void | Promise<void>` - Test function (can be async)

### `describe(name, fn)`

Groups related tests together.

- **name**: `string` - Group name
- **fn**: `() => void` - Function containing test definitions

### `expect(value)`

Creates an assertion for the given value. Uses `@std/expect` under the hood.

```typescript
expect(value).toBe(expected);
expect(value).toEqual(expected);
expect(value).toBeDefined();
expect(value).toBeTruthy();
expect(value).toContain(item);
expect(fn).toThrow();
// ... and more
```

## Test Context

Each test function receives a `ctx` object with the following methods:

### `ctx.skip()`

Skips the current test. The test will be marked as `skip` in results.

### `ctx.fail(message?)`

Explicitly fails the current test with an optional message.

### `ctx.succeed()`

Explicitly passes the current test and exits early.

## Types

```typescript
interface TestContext {
  skip(): never;
  fail(message?: string): never;
  succeed(): never;
}

interface TestResult {
  test: string;
  result: 'pass' | 'fail' | 'skip';
  error: string | null;
  duration: number;
}

interface TestRunResult {
  testResults: TestResult[];
}

type TestFunction = (ctx: TestContext) => void | Promise<void>;
```

## License

AGPL-3.0
