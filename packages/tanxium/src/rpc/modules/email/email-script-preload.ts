import type { ContextHandlerDefinition } from '@/workers/worker-preload.ts';

export const EMAIL_CONTEXT_TYPE = 'email';

export const EMAIL_CONTEXT_HANDLER: ContextHandlerDefinition = {
  type: EMAIL_CONTEXT_TYPE,
  // deno-lint-ignore no-explicit-any
  builder: (context: any) => {
    const workspace = new YasumuWorkspace(context);
    const ctx = {
      workspace,
    };

    const args = [ctx, context.email];
    const getContext = () => ctx.workspace.toContext();

    return { args, getContext };
  },
  extractor: (result, builtContext) => {
    const { getContext } = builtContext;
    const updatedContext = getContext();
    const extractedResult = result;

    return { updatedContext, extractedResult };
  },
};
