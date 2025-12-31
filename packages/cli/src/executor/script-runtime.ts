import * as vm from 'node:vm';
import type { Environment, RestEntity } from '../workspace/loader.js';

export interface ScriptContext {
  method: string;
  url: string;
  headers: Map<string, string>;
  body: string | null;
  environment: {
    variables: Map<string, string>;
    secrets: Map<string, string>;
  };
  response?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
  };
}

export interface ScriptResult {
  success: boolean;
  context: ScriptContext;
  mockResponse?: MockResponse;
  error?: string;
}

export interface MockResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
}

class YasumuWorkspaceEnvironment {
  private variables: Map<string, string>;
  private secrets: Map<string, string>;

  constructor(env: ScriptContext['environment']) {
    this.variables = new Map(env.variables);
    this.secrets = new Map(env.secrets);
  }

  getVariable(key: string): string | undefined {
    return this.variables.get(key);
  }

  setVariable(key: string, value: string): void {
    this.variables.set(key, value);
  }

  getSecret(key: string): string | undefined {
    return this.secrets.get(key);
  }

  toContext(): ScriptContext['environment'] {
    return {
      variables: this.variables,
      secrets: this.secrets,
    };
  }
}

class YasumuRequest {
  readonly method: string;
  url: string;
  readonly headers: Map<string, string>;
  body: string | null;
  readonly env: YasumuWorkspaceEnvironment;

  constructor(context: ScriptContext, env: YasumuWorkspaceEnvironment) {
    this.method = context.method;
    this.url = context.url;
    this.headers = new Map(context.headers);
    this.body = context.body;
    this.env = env;
  }

  toContext(): ScriptContext {
    return {
      method: this.method,
      url: this.url,
      headers: this.headers,
      body: this.body,
      environment: this.env.toContext(),
    };
  }
}

class YasumuResponse {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
  private readonly _body: string;
  readonly env: YasumuWorkspaceEnvironment;
  private _json: unknown = null;

  constructor(
    body: string,
    init: {
      status?: number;
      statusText?: string;
      headers?: Record<string, string>;
    } = {},
    env?: YasumuWorkspaceEnvironment,
  ) {
    this._body = body;
    this.status = init.status ?? 200;
    this.statusText = init.statusText ?? 'OK';
    this.headers = init.headers ?? {};
    this.env =
      env ??
      new YasumuWorkspaceEnvironment({
        variables: new Map(),
        secrets: new Map(),
      });
  }

  text(): string {
    return this._body;
  }

  json(): unknown {
    if (this._json === null) {
      try {
        this._json = JSON.parse(this._body);
      } catch {
        this._json = null;
      }
    }
    return this._json;
  }

  static fromContext(
    context: ScriptContext,
    env: YasumuWorkspaceEnvironment,
  ): YasumuResponse | null {
    if (!context.response) return null;
    return new YasumuResponse(
      context.response.body,
      {
        status: context.response.status,
        statusText: context.response.statusText,
        headers: context.response.headers,
      },
      env,
    );
  }

  toContextData(): MockResponse {
    return {
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      body: this._body,
    };
  }
}

const YasumuGlobal = {
  cuid(): string {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 11)}`;
  },
  ui: {
    async showNotification(_opts: {
      title: string;
      message: string;
      variant?: string;
    }): Promise<void> {
      // No-op in CLI context
    },
  },
};

export class ScriptExecutor {
  async executeOnRequest(
    script: string,
    context: ScriptContext,
  ): Promise<ScriptResult> {
    return this.executeScript(script, 'onRequest', context);
  }

  async executeOnResponse(
    script: string,
    context: ScriptContext,
  ): Promise<ScriptResult> {
    return this.executeScript(script, 'onResponse', context);
  }

  // TODO: use typescript compiler or something like that
  // instead of this regex magic which is not very reliable
  private transformScript(script: string): string {
    let transformed = script;

    transformed = transformed.replace(/interface\s+\w+\s*\{[^}]*\}/gs, '');
    transformed = transformed.replace(/type\s+\w+\s*=\s*[^;]+;/g, '');

    transformed = transformed.replace(
      /export\s+(async\s+)?function/g,
      '$1function',
    );
    transformed = transformed.replace(/export\s+(const|let|var)\s+/g, '$1 ');

    transformed = transformed.replace(
      /function\s+(\w+)\s*\(([^)]*)\)/g,
      (_match, fnName, params) => {
        const cleanParams = params
          .split(',')
          .map((p: string) => p.split(':')[0].trim())
          .filter(Boolean)
          .join(', ');
        return `function ${fnName}(${cleanParams})`;
      },
    );

    transformed = transformed.replace(/<[^>]+>/g, '');

    transformed = transformed.replace(/\)\s*:\s*\w+(\[\])?\s*\{/g, ') {');

    return transformed;
  }

  private async executeScript(
    script: string,
    invocationTarget: 'onRequest' | 'onResponse',
    context: ScriptContext,
  ): Promise<ScriptResult> {
    try {
      const env = new YasumuWorkspaceEnvironment(context.environment);
      const req = new YasumuRequest(context, env);
      const res = context.response
        ? YasumuResponse.fromContext(context, env)
        : null;

      const transformedScript = this.transformScript(script);

      const wrappedScript = `
        (async () => {
          ${transformedScript}

          if (typeof ${invocationTarget} === 'function') {
            return await ${invocationTarget}(__req__, __res__);
          }
          return null;
        })();
      `;

      const vmContext = vm.createContext({
        __req__: req,
        __res__: res,
        console,
        Yasumu: YasumuGlobal,
        YasumuResponse,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        fetch,
        URL,
        URLSearchParams,
        Headers,
        Request,
        Response,
        JSON,
        Object,
        Array,
        String,
        Number,
        Boolean,
        Date,
        Math,
        RegExp,
        Error,
        Map,
        Set,
        Promise,
        crypto,
      });

      const result = await vm.runInContext(wrappedScript, vmContext, {
        timeout: 30000,
      });

      const updatedContext = req.toContext();
      let mockResponse: MockResponse | undefined;

      if (result instanceof YasumuResponse) {
        mockResponse = result.toContextData();
      }

      return {
        success: true,
        context: updatedContext,
        mockResponse,
      };
    } catch (error) {
      return {
        success: false,
        context,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export function buildScriptContext(
  entity: RestEntity,
  environment: Environment | undefined,
  url: string,
  headers: Record<string, string>,
  body: string | null,
): ScriptContext {
  const variables = new Map<string, string>();
  const secrets = new Map<string, string>();

  if (environment) {
    for (const v of environment.variables) {
      if (v.enabled) {
        variables.set(v.key, v.value);
      }
    }
    for (const s of environment.secrets) {
      if (s.enabled) {
        const envKey = `YASUMU_ENV_${s.key}`;
        const envValue = process.env[envKey];
        if (envValue !== undefined) {
          secrets.set(s.key, envValue);
        }
      }
    }
  }

  return {
    method: entity.method,
    url,
    headers: new Map(Object.entries(headers)),
    body,
    environment: { variables, secrets },
  };
}

export function applyContextToRequest(context: ScriptContext): {
  url: string;
  headers: Record<string, string>;
  body: string | null;
} {
  const headers: Record<string, string> = {};
  context.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    url: context.url,
    headers,
    body: context.body,
  };
}
