import { GRAPHQL_CONTEXT_HANDLER } from '@/rpc/modules/graphql/graphql-script-preload.ts';
import { REST_CONTEXT_HANDLER } from '@/rpc/modules/rest/rest-script-preload.ts';

import { EMAIL_CONTEXT_HANDLER } from '../rpc/modules/email/email-script-preload.ts';
import { TEST_CONTEXT_HANDLER } from './common/test-script-preload.ts';
import { SCRIPT_WORKER_HEARTBEAT_TIMEOUT } from './common/worker-heartbeat.ts';

// a pure function that the worker can use to generate its preload script
// this function is stringified and sent to the worker at runtime
// deno-lint-ignore no-explicit-any
export type ScriptContextFunction<T extends any[] = [], R = any> = (...args: T) => R;

export interface BuiltContextExtractor {
  // deno-lint-ignore no-explicit-any
  getContext: () => any;
}

export interface ScriptContextBuilderResult {
  // deno-lint-ignore no-explicit-any
  args: any[];
  // deno-lint-ignore no-explicit-any
  getContext: () => any;
}

export interface ScriptContextExtractorResult {
  // deno-lint-ignore no-explicit-any
  updatedContext: any;
  // deno-lint-ignore no-explicit-any
  extractedResult: any;
}

export interface ContextHandlerDefinition {
  type: string;
  builder: string | ScriptContextFunction<[context: Record<string, unknown>], ScriptContextBuilderResult>;
  extractor:
    | string
    | ScriptContextFunction<[result: unknown, builtContext: BuiltContextExtractor], ScriptContextExtractorResult>;
}

export type WorkerTransport = 'web' | 'worker-threads';

function getWorkerTransportPrelude(transport: WorkerTransport): string {
  if (transport === 'worker-threads') {
    return /* javascript */ `
  import { parentPort } from 'node:worker_threads';

  const postWorkerMessage = (message) => parentPort.postMessage(message);
  const onWorkerMessage = (handler) => parentPort.on('message', handler);
  const terminateWorker = () => process.exit(0);`;
  }

  return /* javascript */ `
  const postWorkerMessage = (message) => self.postMessage(message);
  const onWorkerMessage = (handler) => self.addEventListener('message', (event) => handler(event.data));
  const terminateWorker = () => self.close();`;
}

export function generateWorkerPreload(
  handlers: ContextHandlerDefinition[],
  transport: WorkerTransport = 'web',
): string {
  const handlerEntries = handlers
    .map(
      (h) => /* typescript */ `
  '${h.type}': {
    build: (context) => {
      ${
        typeof h.builder === 'string'
          ? `${h.builder}\nreturn { args, getContext };`
          : `return (${h.builder.toString()})(context);`
      }
    },
    extract: (result, builtContext) => {
      ${
        typeof h.extractor === 'string'
          ? `const { getContext } = builtContext;\n${h.extractor}\nreturn { updatedContext, extractedResult };`
          : `return (${h.extractor.toString()})(result, builtContext);`
      }
    },
  }`,
    )
    .join(',\n');

  return /* javascript */ `
  import { createRequire } from 'node:module';
  import { pathToFileURL } from 'node:url';
  import { runTest, test as _test, expect as _expect, describe as _describe } from 'yasumu:test';
${getWorkerTransportPrelude(transport)}

  // Each script worker has an isolated global scope. CommonJS dependencies
  // loaded from user modules (for example, nodemailer) need their own require.
  if (typeof globalThis.require !== 'function') {
    globalThis.require = (specifier) => {
      const baseDir = Yasumu.getWorkspaceDir() ?? Deno.cwd();
      return createRequire(
        pathToFileURL(baseDir + '/__yasumu_virtual_module__.ts'),
      )(specifier);
    };
  }

  const HEARTBEAT_INTERVAL = ${SCRIPT_WORKER_HEARTBEAT_TIMEOUT};

  const heartbeatTimer = setInterval(() => {
    postWorkerMessage({ type: 'heartbeat' });
  }, HEARTBEAT_INTERVAL);

  if (heartbeatTimer && typeof heartbeatTimer === 'object' && 'unref' in heartbeatTimer) {
    heartbeatTimer.unref();
  } else {
    Deno.unrefTimer(heartbeatTimer);
  }

  globalThis.test = _test;
  globalThis.expect = _expect;
  globalThis.describe = _describe;

  const contextHandlers = {
${handlerEntries}
  };

  async function executeHandler(mod, invocationTarget, contextType, context) {
    if (invocationTarget === 'onTest') {
      return executeTestHandler(mod, contextType, context);
    }

    const targetFn = mod[invocationTarget];

    if (typeof targetFn !== 'function') {
      return {
        success: false,
        context,
        error: 'Function "' + invocationTarget + '" not found or is not a function',
      };
    }

    const handler = contextHandlers[contextType];
    if (!handler) {
      return {
        success: false,
        context,
        error: 'Unknown context type: ' + contextType,
      };
    }

    const builtContext = handler.build(context);
    const result = await targetFn(...builtContext.args);
    const { updatedContext, extractedResult } = handler.extract(result, builtContext);

    return {
      success: true,
      context: updatedContext,
      result: extractedResult,
    };
  }

  async function executeTestHandler(mod, contextType, context) {
    const targetFn = mod.onTest;

    if (typeof targetFn !== 'function') {
      return {
        success: true,
        context,
        result: { testResults: [] },
      };
    }

    const handler = contextHandlers[contextType];
    if (!handler) {
      return {
        success: false,
        context,
        error: 'Unknown context type for test: ' + contextType,
      };
    }

    try {
      const builtContext = handler.build(context);

      const testResult = await runTest(() => {
        return targetFn(...builtContext.args);
      });

      return {
        success: true,
        context,
        result: testResult,
      };
    } catch (error) {
      return {
        success: false,
        context,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  postWorkerMessage({ type: 'ready' });

  onWorkerMessage(async (message) => {
    if (message.type === 'terminate') {
      clearInterval(heartbeatTimer);
      terminateWorker();
      return;
    }

    if (message.type === 'publish-message') {
      const { event, data } = message;
      if (!event) return;
      Yasumu.queue.publish(event, data);
      return;
    }

    if (message.type !== 'execute') return;

    const { requestId, moduleKey, invocationTarget, contextType, context } = message;

    try {
      const mod = await import('yasumu:virtual/' + moduleKey);
      const result = await executeHandler(mod, invocationTarget, contextType, context);

      if (result.success) {
        postWorkerMessage({
          type: 'execution-success',
          requestId,
          context: result.context,
          result: result.result,
        });
      } else {
        postWorkerMessage({
          type: 'execution-error',
          requestId,
          context: result.context,
          error: result.error,
        });
      }
    } catch (error) {
      postWorkerMessage({
        type: 'execution-error',
        requestId,
        context,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
`;
}

export function getGlobalWorkerPreload(transport: WorkerTransport = 'web'): string {
  return generateWorkerPreload(
    [REST_CONTEXT_HANDLER, GRAPHQL_CONTEXT_HANDLER, TEST_CONTEXT_HANDLER, EMAIL_CONTEXT_HANDLER],
    transport,
  );
}
