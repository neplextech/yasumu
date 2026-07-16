/**
 * Canonical runtime protocol implementation injected into Tanxium script workers.
 *
 * The returned source intentionally contains plain JavaScript because it is
 * embedded into the generated Blob worker alongside the legacy protocol.
 */
export function getRuntimeWorkerSupportSource(): string {
  return /* javascript */ `
  let activeRuntimeState = null;
  const pendingRuntimeHostCalls = new Map();

  class RuntimeEnvironment {
    constructor(snapshot) {
      this.id = snapshot.id;
      this.name = snapshot.name;
      this.variables = structuredClone(snapshot.variables);
      this.secrets = structuredClone(snapshot.secrets);
    }

    getVariable(name) { return this.variables[name]; }
    getSecret(name) { return this.secrets[name]; }
    getAllVariables() { return structuredClone(this.variables); }
    getAllSecrets() { return structuredClone(this.secrets); }
    setVariable(name, value) { this.variables[name] = structuredClone(value); }
    setSecret(name, value) { this.secrets[name] = value; }
    deleteVariable(name) { return delete this.variables[name]; }
    deleteSecret(name) { return delete this.secrets[name]; }
    hasVariable(name) { return Object.prototype.hasOwnProperty.call(this.variables, name); }
    hasSecret(name) { return Object.prototype.hasOwnProperty.call(this.secrets, name); }

    applyLegacy(data) {
      if (!data) return;
      this.variables = Object.fromEntries(
        data.variables.filter((entry) => entry.enabled).map((entry) => [entry.key, entry.value]),
      );
      this.secrets = Object.fromEntries(
        data.secrets.filter((entry) => entry.enabled).map((entry) => [entry.key, entry.value]),
      );
    }

    snapshot() {
      return {
        id: this.id,
        name: this.name,
        variables: structuredClone(this.variables),
        secrets: structuredClone(this.secrets),
      };
    }
  }

  function requireRuntimeState() {
    if (!activeRuntimeState) {
      throw runtimeWorkerError('SCRIPT_CONTEXT_UNAVAILABLE', 'The script API is only available during hook execution');
    }
    return activeRuntimeState;
  }

  const runtimeBindings = {};
  Object.defineProperties(runtimeBindings, {
    workspace: { enumerable: true, get: () => requireRuntimeState().workspace },
    runtime: { enumerable: true, get: () => requireRuntimeState().runtime },
    env: { enumerable: true, get: () => requireRuntimeState().environment },
    files: { enumerable: true, get: () => requireRuntimeState().workspace.files },
  });
  globalThis.__yasumuRuntimeBindings = runtimeBindings;

  function createRuntimeWorkspace(invocation, environment) {
    const entityApi = (kind) => ({
      get: (id) => callRuntimeHost('entity.get', { kind, id }),
      list: () => callRuntimeHost('entity.list', { kind }),
      execute: (id, options = {}) => callRuntimeHost('entity.execute', { kind, id, options }),
    });
    const files = {
      resolve: (path) => callRuntimeHost('file.resolve', { path }),
      async open(pathOrReference) {
        const reference = typeof pathOrReference === 'string'
          ? await callRuntimeHost('file.resolve', { path: pathOrReference })
          : pathOrReference;
        const result = await callRuntimeHost('file.open', { reference });
        return new File([new Uint8Array(result.bytes)], result.file.name, { type: result.file.mimeType });
      },
    };

    return {
      ...invocation.workspace,
      rest: entityApi('rest'),
      graphql: entityApi('graphql'),
      email: {
        async list(options = {}) {
          const result = await callRuntimeHost('email.list', {
            since: normalizeRuntimeSince(options.since, invocation.execution.startedAt),
            limit: options.limit,
          });
          return result.emails;
        },
        async awaitEmail(predicate, options = {}) {
          const state = requireRuntimeState();
          const signal = options.signal ?? state.controller.signal;
          const since = normalizeRuntimeSince(options.since, invocation.execution.startedAt);
          const deadline = options.timeoutMs === undefined
            ? undefined
            : Date.now() + Math.max(0, options.timeoutMs);
          let cursor;
          while (true) {
            const timeoutMs = deadline === undefined ? undefined : deadline - Date.now();
            if (timeoutMs !== undefined && timeoutMs <= 0) {
              throw runtimeWorkerError('SCRIPT_EMAIL_TIMEOUT', 'No matching email arrived before the timeout');
            }
            const result = await callRuntimeHost(
              'email.next',
              { since, cursor, timeoutMs },
              signal,
            );
            cursor = result.cursor;
            if (!result.email) {
              throw runtimeWorkerError('SCRIPT_EMAIL_TIMEOUT', 'No matching email arrived before the timeout');
            }
            if (await predicate(result.email)) return result.email;
          }
        },
      },
      env: environment,
      files,
    };
  }

  function createRuntimeDescriptor(invocation, controller) {
    return {
      kind: 'tanxium',
      apiVersion: RUNTIME_API_VERSION,
      capabilities: {
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
      },
      execution: invocation.execution,
      cancel(reason) {
        const state = requireRuntimeState();
        state.cancelReason = reason ?? 'Cancelled by script';
        controller.abort(state.cancelReason);
      },
      async requestPermission(capability, resource, reason) {
        const result = await callRuntimeHost('permission.request', {
          capability,
          resource,
          reason,
          executionId: invocation.execution.id,
        });
        return result.granted;
      },
    };
  }

  async function callRuntimeHost(method, input, signal = requireRuntimeState().controller.signal) {
    const state = requireRuntimeState();
    if (signal.aborted) throw runtimeAbortError(signal.reason);

    const id = crypto.randomUUID();
    const result = await new Promise((resolve, reject) => {
      const abortListener = () => {
        pendingRuntimeHostCalls.delete(id);
        reject(runtimeAbortError(signal.reason));
      };
      signal.addEventListener('abort', abortListener, { once: true });
      pendingRuntimeHostCalls.set(id, { requestId: state.requestId, resolve, reject, signal, abortListener });
      postWorkerMessage({ type: 'host-call', requestId: state.requestId, call: { id, method, input } });
    });
    if (result.error) throw runtimeErrorFromSerialized(result.error);
    return result.output;
  }

  function resolveRuntimeHostCall(message) {
    const pending = pendingRuntimeHostCalls.get(message.result.id);
    if (!pending || pending.requestId !== message.requestId) return;
    pendingRuntimeHostCalls.delete(message.result.id);
    pending.signal.removeEventListener('abort', pending.abortListener);
    pending.resolve(message.result);
  }

  function rejectRuntimeHostCalls(requestId, error) {
    for (const [id, pending] of pendingRuntimeHostCalls) {
      if (pending.requestId !== requestId) continue;
      pendingRuntimeHostCalls.delete(id);
      pending.signal.removeEventListener('abort', pending.abortListener);
      pending.reject(error);
    }
  }

  function createRuntimeBaseContext(state) {
    return {
      id: state.invocation.entity.id,
      entity: state.invocation.entity,
      workspace: state.workspace,
      execution: state.invocation.execution,
      signal: state.controller.signal,
      cancel(reason) {
        state.cancelReason = reason ?? 'Cancelled by script';
        state.controller.abort(state.cancelReason);
      },
    };
  }

  async function executeRuntimeHook(state, moduleKey) {
    if (state.invocation.hook === 'onTest' && state.invocation.execution.mode !== 'test') {
      throw runtimeWorkerError('SCRIPT_TEST_MODE_REQUIRED', 'onTest can only run during an explicit test execution');
    }

    let module;
    try {
      module = await import('yasumu:virtual/' + moduleKey);
    } catch (error) {
      if (error instanceof Error) {
        Object.defineProperty(error, 'code', { value: 'SCRIPT_COMPILE_ERROR', configurable: true });
        throw error;
      }
      throw runtimeWorkerError('SCRIPT_COMPILE_ERROR', String(error));
    }
    const hook = module[state.invocation.hook];
    if (typeof hook !== 'function') return createRuntimeResult(state);

    if (state.invocation.hook === 'onRequest') await executeRuntimeRequestHook(state, hook);
    else if (state.invocation.hook === 'onResponse') await executeRuntimeResponseHook(state, hook, false);
    else if (state.invocation.hook === 'onTest') await executeRuntimeResponseHook(state, hook, true);
    else if (state.invocation.hook === 'onEmail') await executeRuntimeEmailHook(state, hook);

    return createRuntimeResult(state);
  }

  async function executeRuntimeRequestHook(state, hook) {
    if (!state.request || !state.invocation.request) {
      throw runtimeWorkerError('SCRIPT_INVALID_INVOCATION', 'onRequest requires a request');
    }
    const legacy = createLegacyRuntimeObjects(state);
    const legacyBefore = JSON.stringify(legacy.request.toContext());
    const base = createRuntimeBaseContext(state);
    const context = {
      ...base,
      req: state.request,
      setRequest(request) {
        if (!(request instanceof Request) || request.bodyUsed) {
          throw runtimeWorkerError('SCRIPT_INVALID_REQUEST', 'setRequest requires an unconsumed standard Request');
        }
        state.request = request;
        state.requestBackup = request.clone();
        context.req = request;
      },
    };

    const result = hook.length >= 2
      ? await hook(legacy.request, null)
      : await hook(runtimeContextWithLegacyAliases(context, legacy.request));
    const legacyAfter = legacy.request.toContext();
    if (JSON.stringify(legacyAfter) !== legacyBefore) {
      applyLegacyRuntimeRequest(state, legacy.request);
      applyLegacyRuntimeEnvironment(state, legacyAfter.environment);
    }

    if (result instanceof Response) state.mockResponse = result;
    else if (result instanceof YasumuResponse) state.mockResponse = legacyResponseToWebResponse(result);
  }

  async function executeRuntimeResponseHook(state, hook, isTest) {
    if (!state.request || !state.response || !state.invocation.request || !state.invocation.response) {
      throw runtimeWorkerError('SCRIPT_INVALID_INVOCATION', state.invocation.hook + ' requires a request and response');
    }
    const legacy = createLegacyRuntimeObjects(state);
    const legacyRequestBefore = JSON.stringify(legacy.request.toContext());
    const legacyResponseBefore = legacy.response ? JSON.stringify(legacy.response.toContextData()) : null;
    const base = createRuntimeBaseContext(state);
    const responseContext = {
      ...base,
      req: state.request,
      res: state.response,
      isMockResponse: state.invocation.isMockResponse ?? false,
    };
    const context = isTest ? { ...responseContext, isTest: true } : responseContext;

    if (isTest) {
      const testResult = await runTest(async () => {
        if (hook.length >= 2) await hook(legacy.request, legacy.response);
        else await hook(runtimeContextWithLegacyAliases(context, legacy.request));
      });
      state.tests = testResult.testResults;
    } else if (hook.length >= 2) {
      await hook(legacy.request, legacy.response);
    } else {
      await hook(runtimeContextWithLegacyAliases(context, legacy.request));
    }

    const legacyRequestAfter = legacy.request.toContext();
    if (JSON.stringify(legacyRequestAfter) !== legacyRequestBefore) {
      applyLegacyRuntimeEnvironment(state, legacyRequestAfter.environment);
    }
    if (legacy.response && JSON.stringify(legacy.response.toContextData()) !== legacyResponseBefore) {
      applyLegacyRuntimeEnvironment(state, legacy.response.workspace.env.toData());
    }
  }

  async function executeRuntimeEmailHook(state, hook) {
    if (!state.invocation.email) {
      throw runtimeWorkerError('SCRIPT_INVALID_INVOCATION', 'onEmail requires an email');
    }
    const context = { ...createRuntimeBaseContext(state), email: state.invocation.email };
    if (hook.length >= 2) await hook(context, state.invocation.email);
    else await hook(context);
  }

  async function createRuntimeResult(state) {
    return {
      request: state.request ? await snapshotRuntimeRequest(state) : undefined,
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

  async function snapshotRuntimeRequest(state) {
    if (!state.request.bodyUsed) return snapshotRequest(state.request, Number.POSITIVE_INFINITY);
    if (!state.requestBackup) {
      throw runtimeWorkerError('SCRIPT_REQUEST_BODY_UNAVAILABLE', 'The consumed request body could not be restored');
    }
    const snapshot = await snapshotRequest(state.requestBackup, Number.POSITIVE_INFINITY);
    return {
      ...snapshot,
      url: state.request.url,
      method: state.request.method,
      headers: [...state.request.headers.entries()],
    };
  }

  function createLegacyRuntimeObjects(state) {
    const context = {
      environment: legacyRuntimeEnvironment(state.environment.snapshot()),
      request: legacyRuntimeRequestData(state.invocation.request),
      response: state.invocation.response ? legacyRuntimeResponseData(state.invocation.response) : null,
      workspace: {
        id: state.invocation.workspace.id,
        name: state.invocation.workspace.name,
        path: state.invocation.workspace.root ?? null,
      },
    };
    const environment = new YasumuWorkspaceEnvironment(context.environment);
    const request = new YasumuRequest(context, environment);
    const response = YasumuResponse.fromContext(context, {
      environment: context.environment,
      workspace: context.workspace,
    });
    return { request, response };
  }

  function legacyRuntimeEnvironment(snapshot) {
    return {
      id: snapshot.id,
      name: snapshot.name,
      variables: Object.entries(snapshot.variables).map(([key, value]) => ({ key, value, enabled: true })),
      secrets: Object.entries(snapshot.secrets).map(([key, value]) => ({ key, value, enabled: true })),
    };
  }

  function legacyRuntimeRequestData(snapshot) {
    if (!snapshot) return { url: 'about:blank', method: 'GET', headers: {}, body: null, parameters: {} };
    const url = new URL(snapshot.url);
    return {
      url: snapshot.url,
      method: snapshot.method,
      headers: Object.fromEntries(snapshot.headers),
      body: runtimeBodyValue(snapshot.body),
      parameters: Object.fromEntries(url.searchParams),
    };
  }

  function legacyRuntimeResponseData(snapshot) {
    return {
      status: snapshot.status,
      statusText: snapshot.statusText,
      headers: Object.fromEntries(snapshot.headers),
      body: runtimeBodyValue(snapshot.body),
    };
  }

  function applyLegacyRuntimeRequest(state, request) {
    const context = request.toContext();
    const headers = new Headers(context.request.headers);
    const url = new URL(context.request.url);
    url.search = new URLSearchParams(context.request.parameters).toString();
    state.request = new Request(url, {
      method: context.request.method,
      headers,
      body: runtimeCanHaveBody(context.request.method) ? runtimeBodyInit(context.request.body, headers) : undefined,
    });
    state.requestBackup = state.request.clone();
  }

  function applyLegacyRuntimeEnvironment(state, environment) {
    state.environment.applyLegacy(environment);
  }

  function legacyResponseToWebResponse(response) {
    const data = response.toContextData();
    const headers = new Headers(data.headers);
    return new Response(runtimeCanHaveResponseBody(data.status) ? runtimeBodyInit(data.body, headers) : null, {
      status: data.status,
      statusText: data.statusText,
      headers,
    });
  }

  function runtimeContextWithLegacyAliases(context, request) {
    return new Proxy(context, {
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

  function runtimeBodyValue(body) {
    if (body.kind === 'empty') return null;
    if (body.kind === 'text') return body.text;
    if (body.kind === 'json') return structuredClone(body.value);
    return new Uint8Array(body.bytes ?? []);
  }

  function runtimeBodyInit(value, headers) {
    if (value === null || value === undefined) return null;
    if (
      typeof value === 'string' || value instanceof ArrayBuffer || value instanceof Blob ||
      value instanceof FormData || value instanceof URLSearchParams
    ) return value;
    if (value instanceof Uint8Array) return Uint8Array.from(value).buffer;
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
    return JSON.stringify(value);
  }

  function runtimeCanHaveBody(method) {
    const normalized = method.toUpperCase();
    return normalized !== 'GET' && normalized !== 'HEAD';
  }

  function runtimeCanHaveResponseBody(status) {
    return status !== 101 && status !== 204 && status !== 205 && status !== 304;
  }

  function normalizeRuntimeSince(value, fallback) {
    return value instanceof Date ? value.getTime() : value ?? fallback;
  }

  function runtimeWorkerError(code, message) {
    const error = new Error(message);
    error.name = 'YasumuRuntimeError';
    Object.defineProperty(error, 'code', { value: code, enumerable: true });
    return error;
  }

  function runtimeErrorFromSerialized(serialized) {
    const error = runtimeWorkerError(serialized.code, serialized.message);
    error.name = serialized.name;
    if (serialized.stack) error.stack = serialized.stack;
    return error;
  }

  function runtimeAbortError(reason) {
    const message = reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : 'Execution cancelled';
    return runtimeWorkerError('SCRIPT_CANCELLED', message);
  }

  function runtimeErrorCode(error, fallback) {
    return error instanceof Error && typeof error.code === 'string' ? error.code : fallback;
  }

  async function handleRuntimeInvoke(message) {
    const controller = new AbortController();
    const environment = new RuntimeEnvironment(message.invocation.environment);
    const state = {
      requestId: message.requestId,
      invocation: message.invocation,
      controller,
      environment,
      request: message.invocation.request ? requestFromSnapshot(message.invocation.request) : undefined,
      requestBackup: message.invocation.request ? requestFromSnapshot(message.invocation.request) : undefined,
      response: message.invocation.response ? responseFromSnapshot(message.invocation.response) : undefined,
      mockResponse: undefined,
      tests: [],
      diagnostics: [],
      cancelReason: undefined,
      workspace: undefined,
      runtime: undefined,
    };
    state.workspace = createRuntimeWorkspace(message.invocation, environment);
    state.runtime = createRuntimeDescriptor(message.invocation, controller);
    activeRuntimeState = state;

    try {
      const result = await executeRuntimeHook(state, message.moduleKey);
      postWorkerMessage({ type: 'result', requestId: message.requestId, result });
    } catch (error) {
      if (controller.signal.aborted) {
        postWorkerMessage({ type: 'result', requestId: message.requestId, result: await createRuntimeResult(state) });
      } else {
        postWorkerMessage({
          type: 'error',
          requestId: message.requestId,
          error: serializeError(error, runtimeErrorCode(error, 'SCRIPT_HOOK_ERROR')),
        });
      }
    } finally {
      rejectRuntimeHostCalls(message.requestId, runtimeWorkerError('SCRIPT_EXECUTION_ENDED', 'Execution ended'));
      if (activeRuntimeState === state) activeRuntimeState = null;
    }
  }

  function cancelRuntimeExecution(message) {
    if (activeRuntimeState?.requestId === message.requestId) {
      activeRuntimeState.cancelReason = message.reason ?? 'Cancelled by host';
      activeRuntimeState.controller.abort(activeRuntimeState.cancelReason);
    }
    rejectRuntimeHostCalls(message.requestId, runtimeAbortError(message.reason));
  }

  async function handleRuntimeWorkerMessage(message) {
    if (message.type === 'host-result') {
      resolveRuntimeHostCall(message);
      return true;
    }
    if (message.type === 'cancel') {
      cancelRuntimeExecution(message);
      return true;
    }
    if (message.type === 'dispose') {
      if (activeRuntimeState) cancelRuntimeExecution({
        requestId: activeRuntimeState.requestId,
        reason: 'Runtime session disposed',
      });
      clearInterval(heartbeatTimer);
      terminateWorker();
      return true;
    }
    if (message.type !== 'invoke') return false;
    await handleRuntimeInvoke(message);
    return true;
  }

  const runtimeConsoleMethods = {
    debug: 'debug',
    log: 'info',
    info: 'info',
    warn: 'warn',
    error: 'error',
  };
  for (const [method, level] of Object.entries(runtimeConsoleMethods)) {
    const original = console[method].bind(console);
    console[method] = (...args) => {
      original(...args);
      if (!activeRuntimeState) return;
      postWorkerMessage({
        type: 'log',
        requestId: activeRuntimeState.requestId,
        log: {
          level,
          message: formatRuntimeLog(...args),
          timestamp: Date.now(),
          data: args.map(runtimeJsonValue),
        },
      });
    };
  }

  function runtimeJsonValue(value) {
    if (value === undefined) return null;
    try { return JSON.parse(JSON.stringify(value)); }
    catch { return String(value); }
  }
`;
}
