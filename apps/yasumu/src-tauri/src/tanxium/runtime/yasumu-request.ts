type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS'
  | 'CONNECT'
  | 'TRACE';

interface TabularPair {
  key: string;
  value: string;
  enabled: boolean;
}

interface EnvironmentData {
  id: string;
  name: string;
  variables: TabularPair[];
  secrets: TabularPair[];
}

interface RestRequestContextData {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body: unknown;
  parameters: Record<string, string>;
}

interface RestResponseContextData {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

interface RestScriptContext {
  environment: EnvironmentData | null;
  request: RestRequestContextData;
  response: RestResponseContextData | null;
}

export class YasumuWorkspaceEnvironment {
  private _data: EnvironmentData | null;
  private _modified: boolean = false;

  constructor(data: EnvironmentData | null) {
    this._data = data
      ? { ...data, variables: [...data.variables], secrets: [...data.secrets] }
      : null;
  }

  private _assertActive(): void {
    if (!this._data) {
      throw new Error(
        'No environment is currently active. Please select an environment first.',
      );
    }
  }

  get id(): string | null {
    return this._data?.id ?? null;
  }

  get name(): string | null {
    return this._data?.name ?? null;
  }

  get isActive(): boolean {
    return this._data !== null;
  }

  getVariable(key: string): string | null {
    this._assertActive();
    const variable = this._data!.variables.find(
      (v) => v.key === key && v.enabled,
    );
    return variable?.value ?? null;
  }

  setVariable(key: string, value: string): void {
    this._assertActive();
    const existing = this._data!.variables.find((v) => v.key === key);
    if (existing) {
      existing.value = value;
      existing.enabled = true;
    } else {
      this._data!.variables.push({ key, value, enabled: true });
    }
    this._modified = true;
  }

  deleteVariable(key: string): boolean {
    this._assertActive();
    const index = this._data!.variables.findIndex((v) => v.key === key);
    if (index !== -1) {
      this._data!.variables.splice(index, 1);
      this._modified = true;
      return true;
    }
    return false;
  }

  hasVariable(key: string): boolean {
    this._assertActive();
    return this._data!.variables.some((v) => v.key === key && v.enabled);
  }

  getSecret(key: string): string | null {
    this._assertActive();
    const secret = this._data!.secrets.find((s) => s.key === key && s.enabled);
    return secret?.value ?? null;
  }

  setSecret(key: string, value: string): void {
    this._assertActive();
    const existing = this._data!.secrets.find((s) => s.key === key);
    if (existing) {
      existing.value = value;
      existing.enabled = true;
    } else {
      this._data!.secrets.push({ key, value, enabled: true });
    }
    this._modified = true;
  }

  deleteSecret(key: string): boolean {
    this._assertActive();
    const index = this._data!.secrets.findIndex((s) => s.key === key);
    if (index !== -1) {
      this._data!.secrets.splice(index, 1);
      this._modified = true;
      return true;
    }
    return false;
  }

  hasSecret(key: string): boolean {
    this._assertActive();
    return this._data!.secrets.some((s) => s.key === key && s.enabled);
  }

  getAllVariables(): Record<string, string> {
    if (!this._data) return {};
    const result: Record<string, string> = {};
    for (const v of this._data.variables) {
      if (v.enabled) result[v.key] = v.value;
    }
    return result;
  }

  getAllSecrets(): Record<string, string> {
    if (!this._data) return {};
    const result: Record<string, string> = {};
    for (const s of this._data.secrets) {
      if (s.enabled) result[s.key] = s.value;
    }
    return result;
  }

  get modified(): boolean {
    return this._modified;
  }

  toData(): EnvironmentData | null {
    return this._data;
  }
}

export class YasumuHeaders {
  private _headers: Record<string, string>;

  constructor(init?: Record<string, string> | YasumuHeaders) {
    if (init instanceof YasumuHeaders) {
      this._headers = { ...init._headers };
    } else {
      this._headers = { ...(init || {}) };
    }
  }

  get(name: string): string | null {
    const key = this._findKey(name);
    return key ? this._headers[key] : null;
  }

  set(name: string, value: string): void {
    const key = this._findKey(name) || name;
    this._headers[key] = value;
  }

  append(name: string, value: string): void {
    const key = this._findKey(name);
    if (key) {
      this._headers[key] = `${this._headers[key]}, ${value}`;
    } else {
      this._headers[name] = value;
    }
  }

  delete(name: string): void {
    const key = this._findKey(name);
    if (key) {
      delete this._headers[key];
    }
  }

  has(name: string): boolean {
    return this._findKey(name) !== null;
  }

  keys(): IterableIterator<string> {
    return Object.keys(this._headers)[Symbol.iterator]();
  }

  values(): IterableIterator<string> {
    return Object.values(this._headers)[Symbol.iterator]();
  }

  entries(): IterableIterator<[string, string]> {
    return Object.entries(this._headers)[Symbol.iterator]();
  }

  forEach(
    callback: (value: string, key: string, parent: YasumuHeaders) => void,
  ): void {
    for (const [key, value] of Object.entries(this._headers)) {
      callback(value, key, this);
    }
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }

  toObject(): Record<string, string> {
    return { ...this._headers };
  }

  private _findKey(name: string): string | null {
    const lowerName = name.toLowerCase();
    for (const key of Object.keys(this._headers)) {
      if (key.toLowerCase() === lowerName) {
        return key;
      }
    }
    return null;
  }
}

export class YasumuURLSearchParams {
  private _params: Map<string, string[]>;

  constructor(init?: Record<string, string> | string | YasumuURLSearchParams) {
    this._params = new Map();

    if (init instanceof YasumuURLSearchParams) {
      for (const [key, values] of init._params) {
        this._params.set(key, [...values]);
      }
    } else if (typeof init === 'string') {
      const params = new URLSearchParams(init);
      for (const [key, value] of params) {
        this.append(key, value);
      }
    } else if (init) {
      for (const [key, value] of Object.entries(init)) {
        this.set(key, value);
      }
    }
  }

  get(name: string): string | null {
    const values = this._params.get(name);
    return values?.[0] ?? null;
  }

  getAll(name: string): string[] {
    return this._params.get(name) ?? [];
  }

  set(name: string, value: string): void {
    this._params.set(name, [value]);
  }

  append(name: string, value: string): void {
    const existing = this._params.get(name) ?? [];
    existing.push(value);
    this._params.set(name, existing);
  }

  delete(name: string): void {
    this._params.delete(name);
  }

  has(name: string): boolean {
    return this._params.has(name);
  }

  keys(): IterableIterator<string> {
    return this._params.keys();
  }

  *values(): IterableIterator<string> {
    for (const values of this._params.values()) {
      for (const value of values) {
        yield value;
      }
    }
  }

  *entries(): IterableIterator<[string, string]> {
    for (const [key, values] of this._params) {
      for (const value of values) {
        yield [key, value];
      }
    }
  }

  forEach(
    callback: (
      value: string,
      key: string,
      parent: YasumuURLSearchParams,
    ) => void,
  ): void {
    for (const [key, value] of this.entries()) {
      callback(value, key, this);
    }
  }

  [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }

  toString(): string {
    const parts: string[] = [];
    for (const [key, value] of this.entries()) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
    return parts.join('&');
  }

  toObject(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key] of this._params) {
      result[key] = this.get(key)!;
    }
    return result;
  }
}

export class YasumuRequest {
  private _url: string;
  private _method: HttpMethod;
  private _headers: YasumuHeaders;
  private _body: unknown;
  private _params: YasumuURLSearchParams;
  private _env: YasumuWorkspaceEnvironment;
  private _context: RestScriptContext;

  constructor(context: RestScriptContext, env?: YasumuWorkspaceEnvironment) {
    this._context = context;
    this._url = context.request.url;
    this._method = context.request.method;
    this._headers = new YasumuHeaders(context.request.headers);
    this._body = context.request.body;
    this._params = new YasumuURLSearchParams(context.request.parameters);
    this._env = env ?? new YasumuWorkspaceEnvironment(context.environment);
  }

  get url(): string {
    return this._url;
  }

  set url(value: string) {
    this._url = value;
  }

  get method(): HttpMethod {
    return this._method;
  }

  set method(value: HttpMethod) {
    this._method = value;
  }

  get headers(): YasumuHeaders {
    return this._headers;
  }

  get body(): unknown {
    return this._body;
  }

  set body(value: unknown) {
    this._body = value;
  }

  get params(): YasumuURLSearchParams {
    return this._params;
  }

  get env(): YasumuWorkspaceEnvironment {
    return this._env;
  }

  json(): unknown {
    if (typeof this._body === 'string') {
      return JSON.parse(this._body);
    }
    return this._body;
  }

  text(): string {
    if (typeof this._body === 'string') {
      return this._body;
    }
    return JSON.stringify(this._body);
  }

  clone(): YasumuRequest {
    return new YasumuRequest(this.toContext(), this._env);
  }

  toContext(): RestScriptContext {
    return {
      environment: this._env.toData(),
      request: {
        url: this._url,
        method: this._method,
        headers: this._headers.toObject(),
        body: this._body,
        parameters: this._params.toObject(),
      },
      response: this._context.response,
    };
  }
}

interface YasumuResponseInit {
  status?: number;
  statusText?: string;
  headers?: Record<string, string> | YasumuHeaders;
  body?: unknown;
}

export class YasumuResponse {
  private _status: number;
  private _statusText: string;
  private _headers: YasumuHeaders;
  private _body: unknown;
  private _ok: boolean;
  private _env: YasumuWorkspaceEnvironment | null;

  constructor(
    body?: unknown,
    init?: YasumuResponseInit,
    env?: YasumuWorkspaceEnvironment,
  ) {
    this._body = body ?? init?.body ?? null;
    this._status = init?.status ?? 200;
    this._statusText = init?.statusText ?? 'OK';
    this._headers =
      init?.headers instanceof YasumuHeaders
        ? init.headers
        : new YasumuHeaders(init?.headers);
    this._ok = this._status >= 200 && this._status < 300;
    this._env = env ?? null;
  }

  static fromContext(
    context: RestScriptContext,
    env?: YasumuWorkspaceEnvironment,
  ): YasumuResponse | null {
    if (!context.response) return null;

    return new YasumuResponse(
      context.response.body,
      {
        status: context.response.status,
        headers: context.response.headers,
      },
      env,
    );
  }

  get status(): number {
    return this._status;
  }

  get statusText(): string {
    return this._statusText;
  }

  get ok(): boolean {
    return this._ok;
  }

  get headers(): YasumuHeaders {
    return this._headers;
  }

  get body(): unknown {
    return this._body;
  }

  get env(): YasumuWorkspaceEnvironment {
    if (!this._env) {
      this._env = new YasumuWorkspaceEnvironment(null);
    }
    return this._env;
  }

  json(): unknown {
    if (typeof this._body === 'string') {
      return JSON.parse(this._body);
    }
    return this._body;
  }

  text(): string {
    if (typeof this._body === 'string') {
      return this._body;
    }
    return JSON.stringify(this._body);
  }

  clone(): YasumuResponse {
    return new YasumuResponse(
      this._body,
      {
        status: this._status,
        statusText: this._statusText,
        headers: new YasumuHeaders(this._headers),
      },
      this._env ?? undefined,
    );
  }

  toContextData(): RestResponseContextData {
    return {
      status: this._status,
      headers: this._headers.toObject(),
      body: this._body,
    };
  }
}
