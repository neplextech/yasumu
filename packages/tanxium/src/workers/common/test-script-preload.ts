import type { ContextHandlerDefinition } from '@/workers/worker-preload.ts';

export const TEST_CONTEXT_TYPE = 'test';

export const TEST_CONTEXT_HANDLER: ContextHandlerDefinition = {
  type: TEST_CONTEXT_TYPE,
  builder: (context) => {
    // deno-lint-ignore no-explicit-any
    const args: any[] = [];
    const getContext = () => context;

    return { args, getContext };
  },
  extractor: (result, builtContext) => {
    const { getContext } = builtContext;
    const updatedContext = getContext();
    const extractedResult = result;

    return { updatedContext, extractedResult };
  },
};
