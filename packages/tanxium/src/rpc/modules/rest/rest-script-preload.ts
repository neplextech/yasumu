import { SCRIPT_WORKER_HEARTBEAT_TIMEOUT } from '../../../workers/common/worker-heartbeat.ts';

export const REST_SCRIPT_PRELOAD = /* typescript */ `
import { parentPort } from 'node:worker_threads';

const HEARTBEAT_INTERVAL = ${SCRIPT_WORKER_HEARTBEAT_TIMEOUT};

const heartbeatTimer = setInterval(() => {
  parentPort.postMessage({ type: 'heartbeat' });
}, HEARTBEAT_INTERVAL);

if (heartbeatTimer && typeof heartbeatTimer === 'object' && 'unref' in heartbeatTimer) {
  heartbeatTimer.unref();
} else {
  Deno.unrefTimer(heartbeatTimer);
}

const moduleCache = new Map();

async function getModule(modulePath) {
  if (!moduleCache.has(modulePath)) {
    moduleCache.set(modulePath, await import(modulePath));
  }
  return moduleCache.get(modulePath);
}

parentPort.postMessage({ type: 'ready' });

parentPort.on('message', async (message) => {
  if (message.type === 'terminate') {
    clearInterval(heartbeatTimer);
    process.exit(0);
    return;
  }

  if (message.type !== 'execute') return;

  const { requestId, module: modulePath, invocationTarget, context } = message;
  
  try {
    const mod = await getModule(modulePath);
    const targetFn = mod[invocationTarget];
    
    if (typeof targetFn !== 'function') {
      parentPort.postMessage({
        type: 'execution-error',
        requestId,
        context,
        error: \`Function "\${invocationTarget}" not found or not a function\`,
      });
      return;
    }

    const env = new YasumuWorkspaceEnvironment(context.environment);
    const req = new YasumuRequest(context, env);
    const res = context.response ? YasumuResponse.fromContext(context, env) : null;
    
    const result = await targetFn(req, res);
    
    let updatedContext = req.toContext();
    let mockResponse = null;

    if (result instanceof YasumuResponse) {
      mockResponse = result.toContextData();
    }
    
    parentPort.postMessage({
      type: 'execution-success',
      requestId,
      context: updatedContext,
      result: mockResponse,
    });
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
