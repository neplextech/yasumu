import type { ContextHandlerDefinition } from '@/workers/worker-preload.ts';

export const TEST_CONTEXT_TYPE = 'test';

export const TEST_CONTEXT_HANDLER: ContextHandlerDefinition = {
  type: TEST_CONTEXT_TYPE,
  builder: /* typescript */ `
    const args = [];
    const getContext = () => context;
  `,
  extractor: /* typescript */ `
    const updatedContext = getContext();
    const extractedResult = result;
  `,
};
