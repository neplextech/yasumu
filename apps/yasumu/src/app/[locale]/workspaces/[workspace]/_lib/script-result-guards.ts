import type { TestResult } from '@yasumu/core';

export interface ScriptMockResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === 'string');
}

function isTestResult(value: unknown): value is TestResult {
  if (!isRecord(value)) return false;

  return (
    typeof value.test === 'string' &&
    (value.result === 'pass' || value.result === 'fail' || value.result === 'skip') &&
    (value.error === null || typeof value.error === 'string') &&
    typeof value.duration === 'number' &&
    Number.isFinite(value.duration)
  );
}

export function parseScriptMockResponse(value: unknown): ScriptMockResponse | null {
  if (
    !isRecord(value) ||
    typeof value.status !== 'number' ||
    !Number.isFinite(value.status) ||
    typeof value.statusText !== 'string' ||
    !isStringRecord(value.headers)
  ) {
    return null;
  }

  return {
    status: value.status,
    statusText: value.statusText,
    headers: value.headers,
    body: value.body,
  };
}

export function parseScriptTestResults(value: unknown): TestResult[] | null {
  if (!isRecord(value) || !Array.isArray(value.testResults)) return null;
  return value.testResults.every(isTestResult) ? value.testResults : null;
}
