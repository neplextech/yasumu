import type {
  CreateRuntimeSessionInput,
  InvokeHookOptions,
  RuntimeCapabilities,
  ScriptHookInvocation,
  ScriptHookResult,
  YasumuRuntimeSession,
  YasumuScriptRuntime,
} from "../../../../runtime-api/src/types.ts";

import {
  ScriptWorker,
  TanxiumRuntimeError,
} from "../../workers/script-worker.ts";
import { WorkerThreadsStrategy } from "../../workers/strategies/worker-threads.strategy.ts";
import { getHeadlessWorkerPreload } from "../../workers/worker-preload-core.ts";

const TANXIUM_CAPABILITIES = Object.freeze({
  workers: true,
  nodeBuiltins: true,
  filesystemRead: true,
  filesystemWrite: true,
  network: true,
  environment: true,
  subprocess: true,
  ffi: true,
  nativeModules: true,
  virtualModules: true,
  workspaceFiles: true,
  email: true,
  nestedExecution: true,
}) satisfies Readonly<RuntimeCapabilities>;

const DEFAULT_EXECUTION_TIMEOUT = 30_000;

export interface TanxiumScriptRuntimeOptions {
  defaultTimeoutMs?: number;
}

export class TanxiumScriptRuntime implements YasumuScriptRuntime {
  public readonly kind = "tanxium";
  public readonly capabilities = TANXIUM_CAPABILITIES;

  readonly #defaultTimeoutMs: number;

  public constructor(options: TanxiumScriptRuntimeOptions = {}) {
    this.#defaultTimeoutMs = options.defaultTimeoutMs ??
      DEFAULT_EXECUTION_TIMEOUT;
  }

  public async createSession(
    input: CreateRuntimeSessionInput,
  ): Promise<YasumuRuntimeSession> {
    const session = new TanxiumRuntimeSession(input, this.#defaultTimeoutMs);
    try {
      await session.start();
      return session;
    } catch (error) {
      await session.dispose();
      throw error;
    }
  }
}

export function createTanxiumScriptRuntime(
  options?: TanxiumScriptRuntimeOptions,
): TanxiumScriptRuntime {
  return new TanxiumScriptRuntime(options);
}

class TanxiumRuntimeSession implements YasumuRuntimeSession {
  readonly #id = crypto.randomUUID();
  readonly #input: CreateRuntimeSessionInput;
  readonly #defaultTimeoutMs: number;
  readonly #worker: ScriptWorker;
  readonly #workspaceModuleKey?: string;

  #disposed = false;
  #queue: Promise<void> = Promise.resolve();

  public constructor(
    input: CreateRuntimeSessionInput,
    defaultTimeoutMs: number,
  ) {
    this.#input = input;
    this.#defaultTimeoutMs = defaultTimeoutMs;
    this.#worker = new ScriptWorker({
      source: getHeadlessWorkerPreload("worker-threads"),
      strategy: new WorkerThreadsStrategy(),
    });

    if (input.workspaceModule) {
      this.#workspaceModuleKey = this.#worker.registerModule(
        `runtime/${this.#id}/workspace/${input.workspaceModule.id}`,
        `export { workspace } from 'yasumu:workspace';\n${input.workspaceModule.code}`,
      );
    }
  }

  public start(): Promise<void> {
    return this.#worker.start();
  }

  public invokeHook(
    invocation: ScriptHookInvocation,
    options: InvokeHookOptions = {},
  ): Promise<ScriptHookResult> {
    const operation = this.#queue.then(() =>
      this.#invokeNow(invocation, options)
    );
    this.#queue = operation.then(
      () => undefined,
      () => undefined,
    );
    return operation;
  }

  public async dispose(): Promise<void> {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#worker.dispose();
  }

  async #invokeNow(
    invocation: ScriptHookInvocation,
    options: InvokeHookOptions,
  ): Promise<ScriptHookResult> {
    this.#assertActive();
    if (invocation.workspace.id !== this.#input.workspace.id) {
      throw runtimeError(
        "SCRIPT_WORKSPACE_MISMATCH",
        `Runtime session belongs to workspace ${this.#input.workspace.id}, not ${invocation.workspace.id}`,
      );
    }

    const code = this.#workspaceModuleKey
      ? rewriteWorkspaceModuleImports(
        invocation.source.code,
        this.#workspaceModuleKey,
      )
      : invocation.source.code;
    const moduleKey = this.#worker.registerModule(
      `runtime/${this.#id}/entity/${invocation.source.id}`,
      code,
    );

    return this.#worker.invokeRuntimeHook(
      moduleKey,
      invocation,
      this.#input.hostCall,
      {
        ...options,
        timeoutMs: options.timeoutMs ?? this.#defaultTimeoutMs,
      },
    );
  }

  #assertActive(): void {
    if (this.#disposed) {
      throw runtimeError(
        "SCRIPT_SESSION_DISPOSED",
        "The Tanxium runtime session was disposed",
      );
    }
  }
}

function rewriteWorkspaceModuleImports(
  code: string,
  workspaceModuleKey: string,
): string {
  const specifier = `yasumu:virtual/${workspaceModuleKey}`;
  return code
    .replaceAll("'yasumu:workspace'", `'${specifier}'`)
    .replaceAll('"yasumu:workspace"', `"${specifier}"`);
}

function runtimeError(code: string, message: string): TanxiumRuntimeError {
  return new TanxiumRuntimeError({
    name: "TanxiumRuntimeError",
    code,
    message,
  });
}
