import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import type { TestResult } from '@yasumu/core';

const ECHO_SERVER_DOMAIN = 'echo.yasumu.local';

export interface GraphqlRequestOptions {
  url: string;
  query: string;
  variables: string | null;
  operationName: string | null;
  headers: Record<string, string>;
  echoServerPort: number | null;
  interpolate: (value: string) => string;
  signal?: AbortSignal;
}

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

export interface GraphqlRequestResult {
  response: GraphqlResponse;
  error: null;
}

export interface GraphqlRequestError {
  response: null;
  error: string;
}

export type GraphqlRequestOutcome = GraphqlRequestResult | GraphqlRequestError;

function isTestResultArray(value: unknown): value is TestResult[] {
  if (!Array.isArray(value)) return false;

  return value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as TestResult).test === 'string' &&
      ((item as TestResult).result === 'pass' ||
        (item as TestResult).result === 'fail' ||
        (item as TestResult).result === 'skip') &&
      ((item as TestResult).error === null || typeof (item as TestResult).error === 'string') &&
      typeof (item as TestResult).duration === 'number',
  );
}

function extractTestResults(parsed: unknown): TestResult[] {
  if (!parsed || typeof parsed !== 'object') return [];

  const directTestResults = (parsed as { testResults?: unknown }).testResults;
  if (isTestResultArray(directTestResults)) {
    return directTestResults;
  }

  const extensionTestResults = (parsed as { extensions?: { testResults?: unknown } }).extensions?.testResults;

  if (isTestResultArray(extensionTestResults)) {
    return extensionTestResults;
  }

  return [];
}

function isGraphqlErrorArray(value: unknown): value is GraphqlError[] {
  if (!Array.isArray(value)) return false;

  return value.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const error = item as Record<string, unknown>;
    if (typeof error.message !== 'string') return false;
    if (
      error.locations !== undefined &&
      (!Array.isArray(error.locations) ||
        !error.locations.every(
          (location) =>
            !!location &&
            typeof location === 'object' &&
            typeof (location as Record<string, unknown>).line === 'number' &&
            typeof (location as Record<string, unknown>).column === 'number',
        ))
    ) {
      return false;
    }
    if (
      error.path !== undefined &&
      (!Array.isArray(error.path) ||
        !error.path.every((segment) => typeof segment === 'string' || typeof segment === 'number'))
    ) {
      return false;
    }
    if (
      error.extensions !== undefined &&
      (!error.extensions || typeof error.extensions !== 'object' || Array.isArray(error.extensions))
    ) {
      return false;
    }
    return true;
  });
}

function buildUrl(baseUrl: string, echoServerPort: number | null, interpolate: (value: string) => string): string {
  let url = interpolate(baseUrl);

  if (echoServerPort) {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === ECHO_SERVER_DOMAIN) {
        urlObj.protocol = 'http';
        urlObj.port = echoServerPort.toString();
        urlObj.hostname = 'localhost';
        url = urlObj.toString();
      }
    } catch {
      // Invalid URL, continue with original
    }
  }

  return url;
}

function parseVariables(
  variables: string | null,
): { value: Record<string, unknown> | null; error: null } | { value: null; error: string } {
  if (!variables || !variables.trim()) {
    return { value: null, error: null };
  }

  try {
    const parsed: unknown = JSON.parse(variables);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { value: null, error: 'GraphQL variables must be a JSON object' };
    }
    return { value: parsed as Record<string, unknown>, error: null };
  } catch {
    return { value: null, error: 'GraphQL variables contain invalid JSON' };
  }
}

export async function executeGraphqlRequest(options: GraphqlRequestOptions): Promise<GraphqlRequestOutcome> {
  const {
    url: baseUrl,
    query,
    variables,
    operationName,
    headers: customHeaders,
    echoServerPort,
    interpolate,
    signal,
  } = options;

  if (!baseUrl) {
    return { response: null, error: 'URL is required' };
  }

  if (!query) {
    return { response: null, error: 'GraphQL query is required' };
  }

  try {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'user-agent': 'Yasumu/1.0',
      origin: 'http://localhost',
    });

    // Add custom headers
    for (const [key, value] of Object.entries(customHeaders)) {
      if (key) {
        headers.set(key, value);
      }
    }

    const url = buildUrl(baseUrl, echoServerPort, interpolate);

    // Build GraphQL request body
    const requestBody: {
      query: string;
      variables?: Record<string, unknown>;
      operationName?: string;
    } = { query };

    const parsedVariables = parseVariables(variables);
    if (parsedVariables.error) {
      return { response: null, error: parsedVariables.error };
    }
    if (parsedVariables.value) {
      requestBody.variables = parsedVariables.value;
    }

    if (operationName) {
      requestBody.operationName = operationName;
    }

    const start = performance.now();
    const response = await tauriFetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal,
    });
    const elapsed = performance.now() - start;

    const responseHeaders = Object.fromEntries(response.headers.entries());
    const rawBody = await response.text();
    const size = new Blob([rawBody]).size;

    let data: unknown = null;
    let errors: GraphqlError[] | null = null;
    let testResults: TestResult[] = [];

    try {
      const parsed: unknown = JSON.parse(rawBody);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const payload = parsed as Record<string, unknown>;
        data = payload.data ?? null;
        errors = isGraphqlErrorArray(payload.errors) ? payload.errors : null;
        testResults = extractTestResults(parsed);
      }
    } catch {
      // Response is not valid JSON
    }

    return {
      response: {
        status: response.status,
        statusText: response.statusText,
        time: elapsed,
        headers: responseHeaders,
        data,
        errors,
        rawBody,
        size,
        testResults,
      },
      error: null,
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { response: null, error: 'Request cancelled' };
    }
    return {
      response: null,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export class GraphqlRequestController {
  private abortController: AbortController | null = null;

  get isActive(): boolean {
    return this.abortController !== null;
  }

  async execute(options: Omit<GraphqlRequestOptions, 'signal'>): Promise<GraphqlRequestOutcome> {
    this.cancel();
    const abortController = new AbortController();
    this.abortController = abortController;

    try {
      return await executeGraphqlRequest({
        ...options,
        signal: abortController.signal,
      });
    } finally {
      if (this.abortController === abortController) {
        this.abortController = null;
      }
    }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
