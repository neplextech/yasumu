import { describe, expect, it } from 'vitest';

import { parseScriptMockResponse, parseScriptTestResults } from './script-result-guards';

describe('script result guards', () => {
  it('accepts valid mock responses and rejects malformed headers', () => {
    expect(
      parseScriptMockResponse({
        status: 201,
        statusText: 'Created',
        headers: { 'content-type': 'application/json' },
        body: { ok: true },
      }),
    ).toEqual({
      status: 201,
      statusText: 'Created',
      headers: { 'content-type': 'application/json' },
      body: { ok: true },
    });
    expect(parseScriptMockResponse({ status: 200, statusText: 'OK', headers: { broken: 42 }, body: '' })).toBeNull();
  });

  it('accepts only complete test results', () => {
    expect(
      parseScriptTestResults({
        testResults: [{ test: 'works', result: 'pass', error: null, duration: 1 }],
      }),
    ).toEqual([{ test: 'works', result: 'pass', error: null, duration: 1 }]);
    expect(parseScriptTestResults({ testResults: [{ test: 'broken', result: 'maybe' }] })).toBeNull();
  });
});
