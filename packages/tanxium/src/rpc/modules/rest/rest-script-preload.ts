import type { ContextHandlerDefinition } from '@/workers/worker-preload.ts';

export const REST_CONTEXT_TYPE = 'rest';

export const REST_CONTEXT_HANDLER: ContextHandlerDefinition = {
  type: REST_CONTEXT_TYPE,
  builder: /* typescript */ `
    const env = new YasumuWorkspaceEnvironment(context.environment);
    const req = new YasumuRequest(context, env);
    const res = YasumuResponse.fromContext(context, env);
    const args = [req, res];
    const getContext = () => req.toContext();
  `,
  extractor: /* typescript */ `
    const updatedContext = getContext();
    let extractedResult = null;
    if (result instanceof YasumuResponse) {
      extractedResult = result.toContextData();
    }
  `,
};
