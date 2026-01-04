import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import type {
  RestEntityData,
  RestEntityRequestBody,
  TabularPair,
} from '@yasumu/common';

const ECHO_SERVER_DOMAIN = 'echo.yasumu.local';
export const MAX_BINARY_BODY_SIZE = 10 * 1024 * 1024; // 10MB threshold for binary
export const MAX_TEXT_BODY_SIZE = 1 * 1024 * 1024; // 1MB threshold for text

export interface RestRequestOptions {
  entity: RestEntityData;
  pathParams: Record<string, { value: string; enabled: boolean }>;
  echoServerPort: number | null;
  interpolate: (value: string) => string;
  signal?: AbortSignal;
}

export type ResponseBodyType = 'text' | 'binary';

export interface RestResponse {
  status: number;
  statusText: string;
  time: number;
  headers: Record<string, string>;
  cookies: string[];
  textBody: string | null;
  binaryBody: ArrayBuffer | null;
  bodyType: ResponseBodyType;
  size: number;
  bodyTruncated: boolean;
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

function isTextContentType(contentType: string): boolean {
  const ct = contentType.toLowerCase();
  if (ct.startsWith('text/')) return true;
  if (ct.includes('json')) return true;
  if (ct.includes('xml')) return true;
  if (ct.includes('javascript')) return true;
  if (ct.includes('css')) return true;
  if (ct.includes('html')) return true;
  if (ct.includes('csv')) return true;
  return false;
}

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

function replacePathParams(
  pathname: string,
  pathParams: Record<string, { value: string; enabled: boolean }>,
  interpolate: (value: string) => string,
): string {
  return pathname.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, key) => {
    const param = pathParams[key];
    if (param?.enabled && param.value) {
      return encodeURIComponent(interpolate(param.value));
    }
    return match;
  });
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

  try {
    const urlObj = new URL(url);
    urlObj.pathname = replacePathParams(
      urlObj.pathname,
      pathParams,
      interpolate,
    );
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
    const withoutProtocol = url.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '');
    const pathStart = withoutProtocol.indexOf('/');
    if (pathStart !== -1) {
      const authority = url.slice(0, url.indexOf(withoutProtocol) + pathStart);
      const pathPortion = withoutProtocol.slice(pathStart);
      const replacedPath = replacePathParams(
        pathPortion,
        pathParams,
        interpolate,
      );
      url = authority + replacedPath;
    }
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
    const headers = new Headers({
      'user-agent': 'Yasumu/1.0',
      origin: 'http://localhost',
    });

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
    const response = await tauriFetch(url, {
      method: entity.method,
      headers,
      body,
      signal,
    });
    const elapsed = performance.now() - start;

    const responseHeaders = Object.fromEntries(response.headers.entries());
    const cookies = extractCookies(response.headers);
    const contentType = response.headers.get('content-type') || '';
    const contentLength = response.headers.get('content-length');
    const declaredSize = contentLength ? parseInt(contentLength, 10) : 0;

    const isText = isTextContentType(contentType);
    const maxSize = isText ? MAX_TEXT_BODY_SIZE : MAX_BINARY_BODY_SIZE;

    let textBody: string | null = null;
    let binaryBody: ArrayBuffer | null = null;
    let bodyTruncated = false;
    let actualSize = declaredSize;

    if (declaredSize > maxSize) {
      bodyTruncated = true;
    } else if (isText) {
      const text = await response.text();
      actualSize = new Blob([text]).size;
      if (actualSize > MAX_TEXT_BODY_SIZE) {
        bodyTruncated = true;
      } else {
        textBody = text;
      }
    } else {
      const buffer = await response.arrayBuffer();
      actualSize = buffer.byteLength;
      if (actualSize > MAX_BINARY_BODY_SIZE) {
        bodyTruncated = true;
      } else {
        binaryBody = buffer;
      }
    }

    return {
      response: {
        status: response.status,
        statusText: response.statusText,
        time: elapsed,
        headers: responseHeaders,
        cookies,
        textBody,
        binaryBody,
        bodyType: isText ? 'text' : 'binary',
        size: actualSize,
        bodyTruncated,
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
