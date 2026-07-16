import { format } from "node:util";
import { parentPort, workerData } from "node:worker_threads";

import {
  type BaseScriptContext,
  type EmailHookContext,
  type JsonValue,
  requestFromSnapshot,
  type RequestHookContext,
  responseFromSnapshot,
  type ResponseHookContext,
  type RuntimeInboundMessage,
  type RuntimeOutboundMessage,
  type ScriptHookInvocation,
  type ScriptHookResult,
  snapshotRequest,
  snapshotResponse,
  type TestHookContext,
} from "@yasumu/runtime-api";

import {
  installLegacyGlobals,
  LegacyRequest,
  LegacyResponse,
  responseFromHookReturn,
  withLegacyRequestAliases,
} from "./compatibility.js";
import {
  createWorkspaceAPI,
  currentExecution,
  emitLog,
  executionStorage,
  MutableEnvironment,
  rejectHostCalls,
  resolveHostCall,
  serializeWorkerError,
  workerError,
  type WorkerExecutionState,
} from "./execution-state.js";
import { installModuleLoader, registerScriptSource } from "./module-loader.js";
import { executeRegisteredTests } from "./test-runtime.js";
import type { NodeWorkerData } from "./worker-data.js";

type ScriptModule = Readonly<Record<string, unknown>>;
type ScriptHook = (...arguments_: unknown[]) => unknown;

if (!parentPort) {
  throw new Error("The Yasumu Node runtime must run inside a worker thread");
}
const port = parentPort;

const data = workerData as NodeWorkerData;
const activeExecutions = new Map<string, WorkerExecutionState>();
const failedExecutions = new Set<string>();

installModuleLoader(data);
installLegacyGlobals();
installConsoleCapture();
installUnhandledErrorCapture();

port.on("message", (message: unknown) => {
  if (!isRuntimeInboundMessage(message)) return;
  switch (message.type) {
    case "invoke":
      void invoke(message.requestId, message.invocation);
      return;
    case "host-result":
      resolveHostCall(message);
      return;
    case "cancel": {
      const state = activeExecutions.get(message.requestId);
      if (state) {
        state.cancelReason = message.reason ?? "Cancelled by host";
        state.controller.abort(state.cancelReason);
      }
      rejectHostCalls(
        message.requestId,
        workerError(
          "SCRIPT_CANCELLED",
          message.reason ?? "Execution cancelled",
        ),
      );
      return;
    }
    case "dispose":
      for (const [requestId, state] of activeExecutions) {
        state.cancelReason = "Runtime session disposed";
        state.controller.abort(state.cancelReason);
        rejectHostCalls(
          requestId,
          workerError("SCRIPT_SESSION_DISPOSED", state.cancelReason),
        );
      }
      port.close();
  }
});

port.postMessage({ type: "ready" } satisfies RuntimeOutboundMessage);

async function invoke(
  requestId: string,
  invocation: ScriptHookInvocation,
): Promise<void> {
  const controller = new AbortController();
  const environment = new MutableEnvironment(invocation.environment);
  const state: WorkerExecutionState = {
    requestId,
    invocation,
    controller,
    environment,
    request: invocation.request
      ? requestFromSnapshot(invocation.request)
      : undefined,
    requestBackup: invocation.request
      ? requestFromSnapshot(invocation.request)
      : undefined,
    response: invocation.response
      ? responseFromSnapshot(invocation.response)
      : undefined,
    logs: [],
    diagnostics: [],
    tests: [],
    testRun: invocation.hook === "onTest"
      ? { tests: [], pendingSuites: [] }
      : undefined,
    workspace: createWorkspaceAPI(invocation, environment),
  };
  activeExecutions.set(requestId, state);

  try {
    const result = await executionStorage.run(state, () => executeHook(state));
    if (!failedExecutions.has(requestId)) {
      port.postMessage(
        { type: "result", requestId, result } satisfies RuntimeOutboundMessage,
      );
    }
  } catch (error) {
    if (state.controller.signal.aborted) {
      const result = await createResult(state);
      port.postMessage(
        { type: "result", requestId, result } satisfies RuntimeOutboundMessage,
      );
    } else if (!failedExecutions.has(requestId)) {
      port.postMessage(
        {
          type: "error",
          requestId,
          error: serializeWorkerError(error),
        } satisfies RuntimeOutboundMessage,
      );
    }
  } finally {
    activeExecutions.delete(requestId);
    failedExecutions.delete(requestId);
    rejectHostCalls(
      requestId,
      workerError("SCRIPT_EXECUTION_ENDED", "The script execution has ended"),
    );
  }
}

async function executeHook(
  state: WorkerExecutionState,
): Promise<ScriptHookResult> {
  if (
    state.invocation.hook === "onTest" &&
    state.invocation.execution.mode !== "test"
  ) {
    throw workerError(
      "SCRIPT_TEST_MODE_REQUIRED",
      "onTest can only run during an explicit test execution",
    );
  }

  const moduleUrl = registerScriptSource(
    state.invocation.source,
    state.invocation.workspace.root,
  );
  const script = (await import(moduleUrl)) as ScriptModule;
  const hookValue = script[state.invocation.hook];
  if (typeof hookValue !== "function") return createResult(state);
  const hook = hookValue as ScriptHook;

  switch (state.invocation.hook) {
    case "onRequest":
      await invokeRequestHook(state, hook);
      break;
    case "onResponse":
      await invokeResponseHook(state, hook, false);
      break;
    case "onTest":
      await invokeResponseHook(state, hook, true);
      if (state.testRun) {
        state.tests = await executeRegisteredTests(state.testRun);
      }
      break;
    case "onEmail":
      await invokeEmailHook(state, hook);
      break;
  }

  return createResult(state);
}

async function invokeRequestHook(
  state: WorkerExecutionState,
  hook: ScriptHook,
): Promise<void> {
  if (!state.request || !state.invocation.request) {
    throw workerError(
      "SCRIPT_INVALID_INVOCATION",
      "onRequest requires a request",
    );
  }

  const legacyRequest = new LegacyRequest(
    state.request,
    state.invocation.request,
  );
  const base = createBaseContext(state);
  const context: RequestHookContext = {
    ...base,
    req: state.request,
    setRequest(request) {
      if (!(request instanceof Request) || request.bodyUsed) {
        throw workerError(
          "SCRIPT_INVALID_REQUEST",
          "setRequest requires an unconsumed standard Request",
        );
      }
      state.request = request;
      state.requestBackup = request.clone();
      context.req = request;
    },
  };

  const value = hook.length >= 2
    ? await hook(legacyRequest, null)
    : await hook(withLegacyRequestAliases(context, legacyRequest));
  if (legacyRequest.hasChanges) {
    state.request = legacyRequest.toRequest();
    state.requestBackup = state.request.clone();
  }

  const mockResponse = responseFromHookReturn(value);
  if (mockResponse) state.mockResponse = mockResponse;
}

async function invokeResponseHook(
  state: WorkerExecutionState,
  hook: ScriptHook,
  isTest: boolean,
): Promise<void> {
  if (
    !state.request || !state.response || !state.invocation.request ||
    !state.invocation.response
  ) {
    throw workerError(
      "SCRIPT_INVALID_INVOCATION",
      `${state.invocation.hook} requires a request and response`,
    );
  }

  const legacyRequest = new LegacyRequest(
    state.request,
    state.invocation.request,
  );
  const legacyResponse = LegacyResponse.fromSnapshot(state.invocation.response);
  const base = createBaseContext(state);
  const responseContext: ResponseHookContext = {
    ...base,
    req: state.request,
    res: state.response,
    isMockResponse: state.invocation.isMockResponse ?? false,
  };
  const context = isTest
    ? ({ ...responseContext, isTest: true } satisfies TestHookContext)
    : responseContext;

  if (hook.length >= 2) {
    await hook(legacyRequest, legacyResponse);
  } else {
    await hook(withLegacyRequestAliases(context, legacyRequest));
  }
}

async function invokeEmailHook(
  state: WorkerExecutionState,
  hook: ScriptHook,
): Promise<void> {
  if (!state.invocation.email) {
    throw workerError("SCRIPT_INVALID_INVOCATION", "onEmail requires an email");
  }
  const context: EmailHookContext = {
    ...createBaseContext(state),
    email: state.invocation.email,
  };
  if (hook.length >= 2) await hook(context, state.invocation.email);
  else await hook(context);
}

function createBaseContext(state: WorkerExecutionState): BaseScriptContext {
  return {
    id: state.invocation.entity.id,
    entity: state.invocation.entity,
    workspace: state.workspace,
    execution: state.invocation.execution,
    signal: state.controller.signal,
    cancel(reason) {
      state.cancelReason = reason ?? "Cancelled by script";
      state.controller.abort(state.cancelReason);
    },
  };
}

async function createResult(
  state: WorkerExecutionState,
): Promise<ScriptHookResult> {
  return {
    request: state.request
      ? await snapshotPossiblyConsumedRequest(state)
      : undefined,
    mockResponse: state.mockResponse
      ? await snapshotResponse(state.mockResponse, Number.POSITIVE_INFINITY)
      : undefined,
    environment: state.environment.snapshot(),
    tests: state.tests,
    logs: [],
    diagnostics: state.diagnostics,
    cancelled: state.controller.signal.aborted || undefined,
    cancelReason: state.cancelReason,
  };
}

async function snapshotPossiblyConsumedRequest(state: WorkerExecutionState) {
  if (!state.request) return undefined;
  if (!state.request.bodyUsed) {
    return snapshotRequest(state.request, Number.POSITIVE_INFINITY);
  }
  if (!state.requestBackup) {
    throw workerError(
      "SCRIPT_REQUEST_BODY_UNAVAILABLE",
      "The consumed request body could not be restored",
    );
  }

  const snapshot = await snapshotRequest(
    state.requestBackup,
    Number.POSITIVE_INFINITY,
  );
  return {
    ...snapshot,
    url: state.request.url,
    method: state.request.method,
    headers: [...state.request.headers.entries()],
  };
}

function installConsoleCapture(): void {
  const methods = {
    debug: "debug",
    log: "info",
    info: "info",
    warn: "warn",
    error: "error",
  } as const;

  for (
    const [method, level] of Object.entries(methods) as Array<
      [keyof typeof methods, (typeof methods)[keyof typeof methods]]
    >
  ) {
    const original = console[method].bind(console);
    console[method] = (...arguments_: unknown[]) => {
      if (!currentExecution()) {
        original(...arguments_);
        return;
      }
      emitLog(level, format(...arguments_), arguments_.map(jsonValue));
    };
  }
}

function installUnhandledErrorCapture(): void {
  const report = (error: unknown) => {
    const state = currentExecution();
    if (!state || failedExecutions.has(state.requestId)) return false;
    failedExecutions.add(state.requestId);
    state.controller.abort(error);
    rejectHostCalls(
      state.requestId,
      workerError("SCRIPT_UNHANDLED_ERROR", "Unhandled script error"),
    );
    port.postMessage(
      {
        type: "error",
        requestId: state.requestId,
        error: serializeWorkerError(error, "SCRIPT_UNHANDLED_ERROR"),
      } satisfies RuntimeOutboundMessage,
    );
    return true;
  };

  process.on("unhandledRejection", (reason) => {
    report(reason);
  });
  process.on("uncaughtException", (error) => {
    if (!report(error)) process.exitCode = 1;
  });
}

function jsonValue(value: unknown): JsonValue {
  if (value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value)) as JsonValue;
  } catch {
    return String(value);
  }
}

function isRuntimeInboundMessage(
  value: unknown,
): value is RuntimeInboundMessage {
  return typeof value === "object" && value !== null && "type" in value &&
    typeof value.type === "string";
}
