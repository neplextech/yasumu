import { EMAIL_CONTEXT_HANDLER } from '../rpc/modules/email/email-script-preload.ts';
import { GRAPHQL_CONTEXT_HANDLER } from '../rpc/modules/graphql/graphql-script-preload.ts';
import { REST_CONTEXT_HANDLER } from '../rpc/modules/rest/rest-script-preload.ts';
import { TEST_CONTEXT_HANDLER } from './common/test-script-preload.ts';
import {
  type BuiltContextExtractor,
  type ContextHandlerDefinition,
  generateWorkerPreload,
  type ScriptContextBuilderResult,
  type ScriptContextExtractorResult,
  type ScriptContextFunction,
  type WorkerTransport,
} from './worker-preload-core.ts';

export {
  type BuiltContextExtractor,
  type ContextHandlerDefinition,
  generateWorkerPreload,
  type ScriptContextBuilderResult,
  type ScriptContextExtractorResult,
  type ScriptContextFunction,
  type WorkerTransport,
};

export function getGlobalWorkerPreload(transport: WorkerTransport = 'web'): string {
  return generateWorkerPreload(
    [REST_CONTEXT_HANDLER, GRAPHQL_CONTEXT_HANDLER, TEST_CONTEXT_HANDLER, EMAIL_CONTEXT_HANDLER],
    transport,
  );
}
