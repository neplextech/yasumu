import { fetch } from '@tauri-apps/plugin-http';
import type {
  RestEntityData,
  RestEntityRequestBody,
  TabularPair,
} from '@yasumu/common';

const ECHO_SERVER_DOMAIN = 'echo.yasumu.local';

export interface RestRequestOptions {
  entity: RestEntityData;
  pathParams: Record<string, { value: string; enabled: boolean }>;
  echoServerPort: number | null;
  interpolate: (value: string) => string;
  signal?: AbortSignal;
}

export interface RestResponse {
  status: number;
  statusText: string;
  time: number;
  headers: Record<string, string>;
  cookies: string[];
  body: string;
  size: number;
}

export interface RestRequestResult {
  response: RestResponse;
  error: null;
}

export interface RestRequestError {
  response: null;
  error: string;
}

export type RestRequestOutcome = RestRequestResult | RestRequestError;

function buildRequestBody(
  body: RestEntityRequestBody | null,
  headers: Headers,
  interpolate: (value: string) => string,
): BodyInit | undefined {
  if (!body) return undefined;

  const { type, value } = body;

  switch (type) {
    case 'json':
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      return typeof value === 'string'
        ? interpolate(value)
        : JSON.stringify(value);

    case 'text':
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'text/plain');
      }
      return typeof value === 'string' ? interpolate(value) : String(value);

    case 'binary':
      if (value instanceof File) {
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', value.type || 'application/octet-stream');
        }
        return value;
      }
      return undefined;

    case 'form-data':
      if (Array.isArray(value)) {
        const formData = new FormData();
        for (const pair of value as TabularPair[]) {
          if (pair.enabled && pair.key) {
            formData.append(interpolate(pair.key), interpolate(pair.value));
          }
        }
        headers.delete('Content-Type');
        return formData;
      }
      return undefined;

    case 'x-www-form-urlencoded':
      if (Array.isArray(value)) {
        const params = new URLSearchParams();
        for (const pair of value as TabularPair[]) {
          if (pair.enabled && pair.key) {
            params.append(interpolate(pair.key), interpolate(pair.value));
          }
        }
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/x-www-form-urlencoded');
        }
        return params;
      }
      return undefined;

    default:
      return undefined;
  }
}

function buildUrl(
  baseUrl: string,
  searchParams: TabularPair[],
  pathParams: Record<string, { value: string; enabled: boolean }>,
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

  url = url.replace(/:([a-zA-Z0-9_]+)/g, (match, key) => {
    const param = pathParams[key];
    if (param?.enabled && param.value) {
      return encodeURIComponent(interpolate(param.value));
    }
    return match;
  });

  try {
    const urlObj = new URL(url);
    for (const param of searchParams) {
      if (param.enabled && param.key) {
        urlObj.searchParams.append(
          interpolate(param.key),
          interpolate(param.value),
        );
      }
    }
    return urlObj.toString();
  } catch {
    return url;
  }
}

function extractCookies(headers: Headers): string[] {
  if ('getSetCookie' in headers && typeof headers.getSetCookie === 'function') {
    return (
      headers as unknown as { getSetCookie: () => string[] }
    ).getSetCookie();
  }
  const setCookie = headers.get('set-cookie');
  return setCookie ? [setCookie] : [];
}

export async function executeRestRequest(
  options: RestRequestOptions,
): Promise<RestRequestOutcome> {
  const { entity, pathParams, echoServerPort, interpolate, signal } = options;

  if (!entity.url) {
    return { response: null, error: 'URL is required' };
  }

  try {
    const headers = new Headers({ 'user-agent': 'Yasumu/1.0' });

    for (const header of entity.requestHeaders || []) {
      if (header.enabled && header.key) {
        headers.append(interpolate(header.key), interpolate(header.value));
      }
    }

    const body = buildRequestBody(entity.requestBody, headers, interpolate);
    const url = buildUrl(
      entity.url,
      entity.searchParameters || [],
      pathParams,
      echoServerPort,
      interpolate,
    );

    const start = performance.now();
    const response = await fetch(url, {
      method: entity.method,
      headers,
      body,
      signal,
    });
    const elapsed = performance.now() - start;

    const responseBody = await response.text();
    const responseHeaders = Object.fromEntries(response.headers.entries());
    const cookies = extractCookies(response.headers);

    const contentLength = response.headers.get('content-length');
    const size = contentLength
      ? parseInt(contentLength, 10)
      : new Blob([responseBody]).size;

    return {
      response: {
        status: response.status,
        statusText: response.statusText,
        time: elapsed,
        headers: responseHeaders,
        cookies,
        body: responseBody,
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

export class RestRequestController {
  private abortController: AbortController | null = null;

  get isActive(): boolean {
    return this.abortController !== null;
  }

  async execute(
    options: Omit<RestRequestOptions, 'signal'>,
  ): Promise<RestRequestOutcome> {
    this.cancel();
    this.abortController = new AbortController();

    try {
      return await executeRestRequest({
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
