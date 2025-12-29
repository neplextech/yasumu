import { SCRIPT_WORKER_HEARTBEAT_TIMEOUT } from '../../../workers/common/worker-heartbeat.ts';

export const REST_SCRIPT_PRELOAD = /* typescript */ `
const HEARTBEAT_INTERVAL = ${SCRIPT_WORKER_HEARTBEAT_TIMEOUT};

let heartbeatTimer = setInterval(() => {
  self.postMessage({ type: 'heartbeat' });
}, HEARTBEAT_INTERVAL);

if ('unref' in heartbeatTimer) {
  heartbeatTimer.unref();
} else if (typeof Deno !== 'undefined') {
  Deno.unrefTimer(heartbeatTimer);
}

const moduleCache = new Map();

async function getModule(modulePath) {
  if (!moduleCache.has(modulePath)) {
    moduleCache.set(modulePath, await import(modulePath));
  }
  return moduleCache.get(modulePath);
}

self.postMessage({ type: 'ready' });

self.onmessage = async (event) => {
  const message = event.data;
  
  if (message.type === 'terminate') {
    clearInterval(heartbeatTimer);
    self.close();
    return;
  }

  if (message.type !== 'execute') return;

  const { requestId, module: modulePath, invocationTarget, context } = message;
  
  try {
    const mod = await getModule(modulePath);
    const targetFn = mod[invocationTarget];
    
    if (typeof targetFn !== 'function') {
      self.postMessage({
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
    
    self.postMessage({
      type: 'execution-success',
      requestId,
      context: updatedContext,
      result: mockResponse,
    });
  } catch (error) {
    self.postMessage({
      type: 'execution-error',
      requestId,
      context,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
`;
