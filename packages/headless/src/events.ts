import type { Diagnostic, RuntimeLog, TestResult } from '@yasumu/runtime-api';

import type {
  ExecutableEntity,
  WorkspaceEnvironment,
  WorkspaceGroup,
  WorkspaceSmtpConfiguration,
  YasumuWorkspace,
} from './model.js';

export interface ExecutionEventBase {
  executionId: string;
  workspaceId: string;
  entityId: string;
  timestamp: number;
  parentExecutionId?: string;
}

export type ExecutionEvent =
  | (ExecutionEventBase & { type: 'execution-started'; mode: 'run' | 'test' })
  | (ExecutionEventBase & { type: 'hook-started'; hook: string; sourceId: string })
  | (ExecutionEventBase & { type: 'hook-completed'; hook: string; sourceId: string; durationMs: number })
  | (ExecutionEventBase & { type: 'request-prepared'; method: string; url: string })
  | (ExecutionEventBase & { type: 'request-sent' })
  | (ExecutionEventBase & { type: 'response-received'; status: number; mocked: boolean })
  | (ExecutionEventBase & { type: 'runtime-log'; log: RuntimeLog })
  | (ExecutionEventBase & { type: 'test-completed'; test: TestResult })
  | (ExecutionEventBase & { type: 'nested-execution-started'; childExecutionId: string })
  | (ExecutionEventBase & { type: 'nested-execution-completed'; childExecutionId: string })
  | (ExecutionEventBase & { type: 'permission-requested'; capability: string; resource?: string })
  | (ExecutionEventBase & { type: 'diagnostic'; diagnostic: Diagnostic })
  | (ExecutionEventBase & { type: 'execution-completed'; durationMs: number })
  | (ExecutionEventBase & { type: 'execution-cancelled'; reason?: string })
  | (ExecutionEventBase & { type: 'execution-failed'; code: string; message: string });

export type DomainEvent =
  | { type: 'workspace-saved'; workspace: YasumuWorkspace }
  | { type: 'workspace-script-updated'; workspaceId: string; scriptId?: string }
  | { type: 'workspace-smtp-updated'; workspaceId: string; smtp?: WorkspaceSmtpConfiguration }
  | { type: 'entity-created'; workspaceId: string; entity: ExecutableEntity }
  | { type: 'entity-updated'; workspaceId: string; previousId: string; entity: ExecutableEntity }
  | { type: 'entity-deleted'; workspaceId: string; entityId: string }
  | { type: 'environment-upserted'; workspaceId: string; environment: WorkspaceEnvironment }
  | { type: 'environment-deleted'; workspaceId: string; environmentId: string }
  | { type: 'group-upserted'; workspaceId: string; group: WorkspaceGroup }
  | { type: 'group-deleted'; workspaceId: string; groupId: string };
