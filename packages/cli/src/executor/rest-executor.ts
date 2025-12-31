import pc from 'picocolors';
import type { RestEntity, Environment } from '../workspace/loader.js';
import {
  ScriptExecutor,
  buildScriptContext,
  applyContextToRequest,
  type ScriptContext,
  type MockResponse,
} from './script-runtime.js';

export interface ExecutionOptions {
  noScript: boolean;
  environment?: Environment;
  verbose?: boolean;
}

export interface ExecutionResult {
  entity: RestEntity;
  success: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: string;
  duration: number;
  error?: string;
  scriptError?: string;
  mocked?: boolean;
}

export class RestExecutor {
  private variables: Map<string, string> = new Map();
  private secrets: Map<string, string> = new Map();
  private readonly scriptExecutor = new ScriptExecutor();
  private readonly environment?: Environment;

  constructor(environment?: Environment) {
    this.environment = environment;
    if (environment) {
      for (const variable of environment.variables) {
        if (variable.enabled) {
          this.variables.set(variable.key, variable.value);
        }
      }

      for (const secret of environment.secrets) {
        if (secret.enabled) {
          const envKey = `YASUMU_ENV_${secret.key}`;
          const envValue = process.env[envKey];
          if (envValue !== undefined) {
            this.variables.set(secret.key, envValue);
            this.secrets.set(secret.key, envValue);
          }
        }
      }
    }
  }

  private substituteVariables(text: string | null): string {
    if (!text) return '';

    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return this.variables.get(key) ?? `{{${key}}}`;
    });
  }

  async execute(
    entity: RestEntity,
    options: ExecutionOptions,
  ): Promise<ExecutionResult> {
    const startTime = performance.now();

    try {
      let url = this.buildUrl(entity);
      let headers = this.buildHeaders(entity);
      let body = this.buildBody(entity);
      let scriptError: string | undefined;
      let mockResponse: MockResponse | undefined;

      if (entity.script && !options.noScript) {
        const scriptContext = buildScriptContext(
          entity,
          this.environment,
          url,
          headers,
          body,
        );

        const onRequestResult = await this.scriptExecutor.executeOnRequest(
          entity.script,
          scriptContext,
        );

        if (!onRequestResult.success) {
          scriptError = `onRequest: ${onRequestResult.error}`;
          if (options.verbose) {
            console.log(pc.yellow(`  ⚠ Script error: ${scriptError}`));
          }
        } else {
          if (onRequestResult.mockResponse) {
            mockResponse = onRequestResult.mockResponse;
          } else {
            const applied = applyContextToRequest(onRequestResult.context);
            url = applied.url;
            headers = applied.headers;
            body = applied.body;
          }
        }
      }

      if (mockResponse) {
        const duration = performance.now() - startTime;
        if (options.verbose) {
          console.log(pc.magenta(`  ⚡ Mocked response from script`));
        }
        return {
          entity,
          success: mockResponse.status >= 200 && mockResponse.status < 300,
          status: mockResponse.status,
          statusText: mockResponse.statusText,
          headers: mockResponse.headers,
          body: mockResponse.body,
          duration,
          mocked: true,
          scriptError,
        };
      }

      const fetchOptions: RequestInit = {
        method: entity.method,
        headers,
      };

      if (body && !['GET', 'HEAD'].includes(entity.method.toUpperCase())) {
        fetchOptions.body = body;
      }

      if (options.verbose) {
        console.log(pc.dim(`  → ${entity.method} ${url}`));
      }

      const response = await fetch(url, fetchOptions);
      const responseBody = await response.text();
      const duration = performance.now() - startTime;

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      if (entity.script && !options.noScript) {
        const responseContext: ScriptContext = {
          method: entity.method,
          url,
          headers: new Map(Object.entries(headers)),
          body,
          environment: {
            variables: this.variables,
            secrets: this.secrets,
          },
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            body: responseBody,
          },
        };

        const onResponseResult = await this.scriptExecutor.executeOnResponse(
          entity.script,
          responseContext,
        );

        if (!onResponseResult.success && options.verbose) {
          console.log(
            pc.yellow(
              `  ⚠ onResponse script error: ${onResponseResult.error}`,
            ),
          );
        }
      }

      return {
        entity,
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        duration,
        scriptError,
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        entity,
        success: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private buildUrl(entity: RestEntity): string {
    let url = this.substituteVariables(entity.url);

    if (entity.parameters.length > 0) {
      for (const param of entity.parameters) {
        if (param.enabled) {
          url = url.replace(
            `:${param.key}`,
            encodeURIComponent(this.substituteVariables(param.value)),
          );
        }
      }
    }

    if (entity.searchParameters.length > 0) {
      const searchParams = new URLSearchParams();
      for (const param of entity.searchParameters) {
        if (param.enabled) {
          searchParams.append(param.key, this.substituteVariables(param.value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    return url;
  }

  private buildHeaders(entity: RestEntity): Record<string, string> {
    const headers: Record<string, string> = {};

    for (const header of entity.headers) {
      if (header.enabled) {
        headers[header.key] = this.substituteVariables(header.value);
      }
    }

    if (entity.body?.type === 'json' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  private buildBody(entity: RestEntity): string | null {
    if (!entity.body?.content) return null;
    return this.substituteVariables(entity.body.content);
  }
}

export function formatResult(result: ExecutionResult, verbose: boolean): void {
  const statusColor = result.success ? pc.green : pc.red;
  const methodColor = getMethodColor(result.entity.method);
  const durationStr = `${result.duration.toFixed(0)}ms`;
  const mockedTag = result.mocked ? pc.magenta(' [mocked]') : '';

  if (result.error) {
    console.log(
      `${methodColor(result.entity.method.padEnd(6))} ${pc.bold(result.entity.name)} ${pc.red('ERROR')} ${pc.dim(durationStr)}`,
    );
    console.log(pc.red(`  └─ ${result.error}`));
    return;
  }

  console.log(
    `${methodColor(result.entity.method.padEnd(6))} ${pc.bold(result.entity.name)} ${statusColor(`${result.status} ${result.statusText}`)}${mockedTag} ${pc.dim(durationStr)}`,
  );

  if (result.scriptError && verbose) {
    console.log(pc.yellow(`  ⚠ ${result.scriptError}`));
  }

  if (verbose && result.headers) {
    console.log(pc.dim('  Headers:'));
    for (const [key, value] of Object.entries(result.headers)) {
      console.log(pc.dim(`    ${key}: ${value}`));
    }
  }

  if (verbose && result.body) {
    console.log(pc.dim('  Body:'));
    try {
      const parsed = JSON.parse(result.body);
      console.log(
        pc.dim(
          '    ' + JSON.stringify(parsed, null, 2).replace(/\n/g, '\n    '),
        ),
      );
    } catch {
      const preview =
        result.body.length > 200
          ? result.body.slice(0, 200) + '...'
          : result.body;
      console.log(pc.dim('    ' + preview));
    }
  }
}

function getMethodColor(method: string) {
  switch (method.toUpperCase()) {
    case 'GET':
      return pc.green;
    case 'POST':
      return pc.yellow;
    case 'PUT':
      return pc.blue;
    case 'PATCH':
      return pc.cyan;
    case 'DELETE':
      return pc.red;
    default:
      return pc.white;
  }
}
