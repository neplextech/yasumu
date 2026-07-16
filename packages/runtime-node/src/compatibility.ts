import type {
  BaseScriptContext,
  EnvironmentScriptAPI,
  JsonValue,
  RequestSnapshot,
  ResponseSnapshot,
  ScriptWorkspace,
  SerializedBody,
} from '@yasumu/runtime-api';

import { requireExecution, runtime, workspace } from './execution-state.js';

type LegacyBody = JsonValue | Uint8Array | ArrayBuffer | Blob | FormData | URLSearchParams | null | undefined;

export interface LegacyResponseInit {
  status?: number;
  statusText?: string;
  headers?: HeadersInit | LegacyHeaders;
  body?: LegacyBody;
}

export class LegacyHeaders implements Iterable<[string, string]> {
  readonly #headers: Headers;
  readonly #markDirty: () => void;

  constructor(init?: HeadersInit | LegacyHeaders, markDirty = () => undefined) {
    this.#headers = init instanceof LegacyHeaders ? new Headers(init.#headers) : new Headers(init);
    this.#markDirty = markDirty;
  }

  get(name: string): string | null {
    return this.#headers.get(name);
  }

  set(name: string, value: string): void {
    this.#headers.set(name, value);
    this.#markDirty();
  }

  append(name: string, value: string): void {
    this.#headers.append(name, value);
    this.#markDirty();
  }

  delete(name: string): void {
    this.#headers.delete(name);
    this.#markDirty();
  }

  has(name: string): boolean {
    return this.#headers.has(name);
  }

  keys(): IterableIterator<string> {
    return this.#headers.keys();
  }

  values(): IterableIterator<string> {
    return this.#headers.values();
  }

  entries(): IterableIterator<[string, string]> {
    return this.#headers.entries();
  }

  forEach(callback: (value: string, key: string, parent: LegacyHeaders) => void): void {
    this.#headers.forEach((value, key) => callback(value, key, this));
  }

  toObject(): Record<string, string> {
    return Object.fromEntries(this.#headers);
  }

  toHeaders(): Headers {
    return this.#headers;
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }
}

export class LegacySearchParams implements Iterable<[string, string]> {
  readonly #params: URLSearchParams;
  readonly #markDirty: () => void;

  constructor(init?: string | Record<string, string> | URLSearchParams, markDirty = () => undefined) {
    this.#params = new URLSearchParams(init);
    this.#markDirty = markDirty;
  }

  get(name: string): string | null {
    return this.#params.get(name);
  }

  getAll(name: string): string[] {
    return this.#params.getAll(name);
  }

  set(name: string, value: string): void {
    this.#params.set(name, value);
    this.#markDirty();
  }

  append(name: string, value: string): void {
    this.#params.append(name, value);
    this.#markDirty();
  }

  delete(name: string): void {
    this.#params.delete(name);
    this.#markDirty();
  }

  has(name: string): boolean {
    return this.#params.has(name);
  }

  keys(): IterableIterator<string> {
    return this.#params.keys();
  }

  values(): IterableIterator<string> {
    return this.#params.values();
  }

  entries(): IterableIterator<[string, string]> {
    return this.#params.entries();
  }

  forEach(callback: (value: string, key: string, parent: LegacySearchParams) => void): void {
    this.#params.forEach((value, key) => callback(value, key, this));
  }

  toString(): string {
    return this.#params.toString();
  }

  toObject(): Record<string, string> {
    return Object.fromEntries(this.#params);
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }
}

export class LegacyRequest {
  #request: Request;
  #url: string;
  #method: string;
  #body: LegacyBody;
  #dirty = false;
  readonly #headers: LegacyHeaders;
  readonly #params: LegacySearchParams;

  constructor(request: Request, snapshot?: RequestSnapshot) {
    this.#request = request;
    this.#url = request.url;
    this.#method = request.method;
    this.#body = snapshot ? valueFromBody(snapshot.body) : null;
    this.#headers = new LegacyHeaders(request.headers, () => {
      this.#dirty = true;
    });
    this.#params = new LegacySearchParams(new URL(request.url).searchParams, () => {
      this.#dirty = true;
    });
  }

  get url(): string {
    return this.#url;
  }

  set url(value: string) {
    this.#url = value;
    this.#dirty = true;
  }

  get method(): string {
    return this.#method;
  }

  set method(value: string) {
    this.#method = value;
    this.#dirty = true;
  }

  get headers(): LegacyHeaders {
    return this.#headers;
  }

  get params(): LegacySearchParams {
    return this.#params;
  }

  get body(): LegacyBody {
    return this.#body;
  }

  set body(value: LegacyBody) {
    this.#body = value;
    this.#dirty = true;
  }

  get env(): EnvironmentScriptAPI {
    return requireExecution().environment;
  }

  get environment(): EnvironmentScriptAPI {
    return this.env;
  }

  get workspace(): ScriptWorkspace {
    return requireExecution().workspace;
  }

  json<T = JsonValue>(): T {
    return (typeof this.#body === 'string' ? JSON.parse(this.#body) : this.#body) as T;
  }

  text(): string {
    return typeof this.#body === 'string' ? this.#body : JSON.stringify(this.#body);
  }

  clone(): LegacyRequest {
    return new LegacyRequest(this.toRequest(), {
      url: this.#url,
      method: this.#method,
      headers: [...this.#headers],
      body: bodySnapshot(this.#body),
    });
  }

  get hasChanges(): boolean {
    return this.#dirty;
  }

  toRequest(): Request {
    if (!this.#dirty) return this.#request;
    const url = new URL(this.#url);
    url.search = this.#params.toString();
    const headers = this.#headers.toHeaders();
    const body = bodyInit(this.#body, headers);
    this.#request = new Request(url, {
      method: this.#method,
      headers,
      body: canHaveBody(this.#method) ? body : undefined,
    });
    this.#dirty = false;
    return this.#request;
  }
}

export class LegacyResponse {
  readonly status: number;
  readonly statusText: string;
  readonly headers: LegacyHeaders;
  readonly #body: LegacyBody;

  constructor(body?: LegacyBody, init: LegacyResponseInit = {}) {
    this.#body = body ?? init.body ?? null;
    this.status = init.status ?? 200;
    this.statusText = init.statusText ?? '';
    this.headers = new LegacyHeaders(init.headers);
  }

  get body(): LegacyBody {
    return this.#body;
  }

  get env(): EnvironmentScriptAPI {
    return requireExecution().environment;
  }

  get workspace(): ScriptWorkspace {
    return requireExecution().workspace;
  }

  json<T = JsonValue>(): T {
    return (typeof this.#body === 'string' ? JSON.parse(this.#body) : this.#body) as T;
  }

  text(): string {
    return typeof this.#body === 'string' ? this.#body : JSON.stringify(this.#body);
  }

  clone(): LegacyResponse {
    return new LegacyResponse(structuredCloneBody(this.#body), {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
    });
  }

  toResponse(): Response {
    const headers = this.headers.toHeaders();
    const body = bodyInit(this.#body, headers);
    return new Response(canHaveResponseBody(this.status) ? body : null, {
      status: this.status,
      statusText: this.statusText,
      headers,
    });
  }

  toContextData(): { status: number; statusText: string; headers: Record<string, string>; body: LegacyBody } {
    return {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers.toObject(),
      body: this.#body,
    };
  }

  static fromSnapshot(snapshot: ResponseSnapshot): LegacyResponse {
    return new LegacyResponse(valueFromBody(snapshot.body), {
      status: snapshot.status,
      statusText: snapshot.statusText,
      headers: snapshot.headers,
    });
  }
}

export function withLegacyRequestAliases<TContext extends BaseScriptContext>(
  context: TContext,
  request: LegacyRequest,
): TContext & LegacyRequest {
  return new Proxy(context as TContext & LegacyRequest, {
    get(target, property, receiver) {
      if (Reflect.has(target, property)) return Reflect.get(target, property, receiver);
      const value = Reflect.get(request, property, request);
      return typeof value === 'function' ? value.bind(request) : value;
    },
    set(target, property, value, receiver) {
      if (Reflect.has(target, property)) return Reflect.set(target, property, value, receiver);
      return Reflect.set(request, property, value, request);
    },
  });
}

export function responseFromHookReturn(value: unknown): Response | undefined {
  if (value instanceof Response) return value;
  if (value instanceof LegacyResponse) return value.toResponse();
  if (typeof value === 'object' && value !== null && 'toResponse' in value && typeof value.toResponse === 'function') {
    const response = value.toResponse();
    if (response instanceof Response) return response;
  }
  return undefined;
}

export function installLegacyGlobals(): void {
  Object.defineProperties(globalThis, {
    YasumuRequest: { value: LegacyRequest, configurable: true },
    YasumuResponse: { value: LegacyResponse, configurable: true },
    YasumuHeaders: { value: LegacyHeaders, configurable: true },
    YasumuURLSearchParams: { value: LegacySearchParams, configurable: true },
    Yasumu: {
      configurable: true,
      value: Object.freeze({
        get workspace() {
          return workspace;
        },
        runtime,
        isWorkerEnvironment: () => true,
      }),
    },
  });
}

function valueFromBody(body: SerializedBody): LegacyBody {
  switch (body.kind) {
    case 'empty':
      return null;
    case 'text':
      return body.text;
    case 'json':
      return structuredClone(body.value);
    case 'binary':
      return new Uint8Array(body.bytes ?? []);
  }
}

function bodyInit(value: LegacyBody, headers: Headers): BodyInit | null {
  if (value === null || value === undefined) return null;
  if (
    typeof value === 'string' ||
    value instanceof ArrayBuffer ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams
  ) {
    return value;
  }
  if (value instanceof Uint8Array) return Uint8Array.from(value).buffer;
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  return JSON.stringify(value);
}

function bodySnapshot(value: LegacyBody): SerializedBody {
  if (value === null || value === undefined) return { kind: 'empty', size: 0, truncated: false };
  if (typeof value === 'string') {
    return { kind: 'text', text: value, size: new TextEncoder().encode(value).byteLength, truncated: false };
  }
  if (value instanceof Uint8Array) {
    return { kind: 'binary', bytes: [...value], size: value.byteLength, truncated: false };
  }
  if (value instanceof ArrayBuffer) {
    const bytes = new Uint8Array(value);
    return { kind: 'binary', bytes: [...bytes], size: bytes.byteLength, truncated: false };
  }
  if (value instanceof Blob || value instanceof FormData || value instanceof URLSearchParams) {
    const text = String(value);
    return { kind: 'text', text, size: new TextEncoder().encode(text).byteLength, truncated: false };
  }
  return { kind: 'json', value, size: new TextEncoder().encode(JSON.stringify(value)).byteLength, truncated: false };
}

function structuredCloneBody(value: LegacyBody): LegacyBody {
  if (value instanceof Blob || value instanceof FormData || value instanceof URLSearchParams) return value;
  return structuredClone(value);
}

function canHaveBody(method: string): boolean {
  return method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD';
}

function canHaveResponseBody(status: number): boolean {
  return status !== 101 && status !== 204 && status !== 205 && status !== 304;
}
