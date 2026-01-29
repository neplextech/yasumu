import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

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

function buildUrl(
  baseUrl: string,
  echoServerPort: number | null,
  interpolate: (value: string) => string,
): string {
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
): Record<string, unknown> | null {
  if (!variables || !variables.trim()) {
    return null;
  }

  try {
    return JSON.parse(variables);
  } catch {
    return null;
  }
}

export async function executeGraphqlRequest(
  options: GraphqlRequestOptions,
): Promise<GraphqlRequestOutcome> {
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
    if (parsedVariables) {
      requestBody.variables = parsedVariables;
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

    try {
      const parsed = JSON.parse(rawBody);
      data = parsed.data ?? null;
      errors = parsed.errors ?? null;
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

  async execute(
    options: Omit<GraphqlRequestOptions, 'signal'>,
  ): Promise<GraphqlRequestOutcome> {
    this.cancel();
    this.abortController = new AbortController();

    try {
      return await executeGraphqlRequest({
        ...options,
        signal: this.abortController.signal,
      });
    } finally {
      this.abortController = null;
    }
  }

  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
