import type { ContextHandlerDefinition } from '@/workers/worker-preload.ts';

export const GRAPHQL_CONTEXT_TYPE = 'graphql';

export const GRAPHQL_CONTEXT_HANDLER: ContextHandlerDefinition = {
  type: GRAPHQL_CONTEXT_TYPE,
  // deno-lint-ignore no-explicit-any
  builder: (context: any) => {
    const env = new YasumuWorkspaceEnvironment(context.environment);
    const req = new YasumuRequest(context, env);
    const res = YasumuResponse.fromContext(context, {
      environment: context.environment,
      workspace: context.workspace,
    });
    const args = [req, res];
    const getContext = () => req.toContext();

    return { args, getContext };
  },
  extractor: (result, builtContext) => {
    const updatedContext = builtContext.getContext();
    let extractedResult = null;
    if (result instanceof YasumuResponse) {
      extractedResult = result.toContextData();
    }
    return { updatedContext, extractedResult };
  },
};
