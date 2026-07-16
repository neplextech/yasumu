import type { ExecutionResult, TestResult } from '@yasumu/core';

export interface GraphqlResponse {
  status: number;
  statusText: string;
  time: number;
  headers: Record<string, string>;
  data: unknown;
  errors: GraphqlError[] | null;
  rawBody: string;
  size: number;
  testResults: TestResult[];
}

export interface GraphqlError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

/** Maps the serializable headless response into the existing GraphQL response panel model. */
export function graphqlResponseFromExecution(result: ExecutionResult): GraphqlResponse | null {
  const response = result.response;
  if (!response) return null;

  const rawBody = bodyText(response.body);
  const parsed = parsePayload(response.body.kind === 'json' ? response.body.value : rawBody);

  return {
    status: response.status,
    statusText: response.statusText,
    time: result.durationMs,
    headers: Object.fromEntries(response.headers),
    data: parsed?.data ?? null,
    errors: isGraphqlErrorArray(parsed?.errors) ? parsed.errors : null,
    rawBody,
    size: response.body.size,
    testResults: result.tests,
  };
}

function bodyText(body: NonNullable<ExecutionResult['response']>['body']): string {
  switch (body.kind) {
    case 'empty':
      return '';
    case 'text':
      return body.text;
    case 'json':
      return JSON.stringify(body.value);
    case 'binary':
      return new TextDecoder().decode(Uint8Array.from(body.bytes ?? []));
  }
}

function parsePayload(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== 'string' || !value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function isGraphqlErrorArray(value: unknown): value is GraphqlError[] {
  return (
    Array.isArray(value) &&
    value.every((entry) => !!entry && typeof entry === 'object' && typeof (entry as GraphqlError).message === 'string')
  );
}
