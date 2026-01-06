import { REST_CONTEXT_HANDLER } from '@/rpc/modules/rest/rest-script-preload.ts';
import { TEST_CONTEXT_HANDLER } from './common/test-script-preload.ts';
import { SCRIPT_WORKER_HEARTBEAT_TIMEOUT } from './common/worker-heartbeat.ts';

export interface ContextHandlerDefinition {
  type: string;
  builder: string;
  extractor: string;
}

export function generateWorkerPreload(
  handlers: ContextHandlerDefinition[],
): string {
  const handlerEntries = handlers
    .map(
      (h) => /* typescript */ `
  '${h.type}': {
    build: (context) => {
      ${h.builder}
      return { args, getContext };
    },
    extract: (result, builtContext) => {
      const { getContext } = builtContext;
      ${h.extractor}
      return { updatedContext, extractedResult };
    },
  }`,
    )
    .join(',\n');

  return /* typescript */ `
import { parentPort } from 'node:worker_threads';
import { runTest, test as _test, expect as _expect, describe as _describe } from 'yasumu:test';

const HEARTBEAT_INTERVAL = ${SCRIPT_WORKER_HEARTBEAT_TIMEOUT};

const heartbeatTimer = setInterval(() => {
  parentPort.postMessage({ type: 'heartbeat' });
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

parentPort.postMessage({ type: 'ready' });

parentPort.on('message', async (message) => {
  if (message.type === 'terminate') {
    clearInterval(heartbeatTimer);
    process.exit(0);
    return;
  }

  if (message.type !== 'execute') return;

  const { requestId, moduleKey, invocationTarget, contextType, context } = message;
  
  try {
    const mod = await import('yasumu:virtual/' + moduleKey);
    const result = await executeHandler(mod, invocationTarget, contextType, context);
    
    if (result.success) {
      parentPort.postMessage({
        type: 'execution-success',
        requestId,
        context: result.context,
        result: result.result,
      });
    } else {
      parentPort.postMessage({
        type: 'execution-error',
        requestId,
        context: result.context,
        error: result.error,
      });
    }
  } catch (error) {
    parentPort.postMessage({
      type: 'execution-error',
      requestId,
      context,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
`;
}

export function getGlobalWorkerPreload(): string {
  return generateWorkerPreload([REST_CONTEXT_HANDLER, TEST_CONTEXT_HANDLER]);
}
