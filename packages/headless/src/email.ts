import type {
  Diagnostic,
  EnvironmentSnapshot,
  RuntimeHostCallHandler,
  RuntimeLog,
  ScriptEntity,
  TestResult,
  WorkspaceEmail,
  YasumuScriptRuntime,
} from '@yasumu/runtime-api';

import { resolveEnvironment } from './environment.js';
import { serializeYasumuError, YasumuError, YasumuErrorCodes } from './errors.js';
import { SecretRedactor } from './interpolation.js';
import type { SecretProvider, WorkspaceRepository } from './ports.js';

export interface EmailHookDependencies {
  workspaces: WorkspaceRepository;
  runtime: YasumuScriptRuntime;
  hostCall: RuntimeHostCallHandler;
  secrets?: SecretProvider;
}

export interface EmailHookResult {
  executionId: string;
  status: 'completed' | 'cancelled' | 'failed';
  logs: RuntimeLog[];
  tests: TestResult[];
  diagnostics: Diagnostic[];
  environment?: Omit<EnvironmentSnapshot, 'secrets'>;
  error?: ReturnType<typeof serializeYasumuError>;
}

export class EmailHookService {
  constructor(private readonly dependencies: EmailHookDependencies) {}

  async handle(workspaceId: string, email: WorkspaceEmail, signal?: AbortSignal): Promise<EmailHookResult> {
    const executionId = crypto.randomUUID();
    const workspace = await this.dependencies.workspaces.get(workspaceId);
    if (!workspace) {
      return {
        executionId,
        status: 'failed',
        logs: [],
        tests: [],
        diagnostics: [],
        error: serializeYasumuError(new Error(`Workspace not found: ${workspaceId}`), YasumuErrorCodes.WorkspaceNotFound),
      };
    }
    const sources = [workspace.script, workspace.smtp?.script].filter((source) => source !== undefined);
    const selectedEnvironment = workspace.environments.find(
      (environment) => environment.id === workspace.activeEnvironmentId,
    );
    const providedSecrets = this.dependencies.secrets
      ? await this.dependencies.secrets.resolve(workspace, selectedEnvironment?.id)
      : {};
    let environment = resolveEnvironment({ environment: selectedEnvironment, providedSecrets }).snapshot;
    const secretValues = new Set(Object.values(environment.secrets).filter(Boolean));
    let redactor = new SecretRedactor(secretValues);
    const logs: RuntimeLog[] = [];
    const tests: TestResult[] = [];
    const diagnostics: Diagnostic[] = [];
    const session = await this.dependencies.runtime.createSession({
      workspace: { id: workspace.id, name: workspace.name, root: workspace.root },
      workspaceModule: workspace.script,
      hostCall: this.dependencies.hostCall,
    });
    try {
      for (const source of sources) {
        const entity: ScriptEntity = { id: workspace.smtp?.id ?? workspace.id, name: 'SMTP', kind: 'email' };
        const result = await session.invokeHook(
          {
            hook: 'onEmail',
            source,
            workspace: { id: workspace.id, name: workspace.name, root: workspace.root },
            entity,
            execution: {
              id: executionId,
              rootId: executionId,
              depth: 0,
              mode: 'run',
              startedAt: Date.now(),
            },
            environment,
            email,
          },
          { signal },
        );
        environment = result.environment;
        for (const value of Object.values(environment.secrets)) if (value) secretValues.add(value);
        redactor = new SecretRedactor(secretValues);
        logs.push(...result.logs);
        tests.push(...result.tests);
        diagnostics.push(...result.diagnostics);
        if (result.cancelled) {
          const error = new YasumuError(
            YasumuErrorCodes.ExecutionCancelled,
            result.cancelReason ?? 'Email hook cancelled the execution',
            { workspaceId, executionId, entityId: workspace.smtp?.id ?? workspace.id },
          );
          return {
            executionId,
            status: 'cancelled',
            logs: redactor.redactValue(logs),
            tests: redactor.redactValue(tests),
            diagnostics: redactor.redactValue(diagnostics),
            environment: {
              id: environment.id,
              name: environment.name,
              variables: redactor.redactValue(environment.variables),
            },
            error: redactor.redactValue(serializeYasumuError(error, YasumuErrorCodes.ExecutionCancelled)),
          };
        }
      }
      return {
        executionId,
        status: 'completed',
        logs: redactor.redactValue(logs),
        tests: redactor.redactValue(tests),
        diagnostics: redactor.redactValue(diagnostics),
        environment: {
          id: environment.id,
          name: environment.name,
          variables: redactor.redactValue(environment.variables),
        },
      };
    } catch (error) {
      return {
        executionId,
        status: signal?.aborted ? 'cancelled' : 'failed',
        logs: redactor.redactValue(logs),
        tests: redactor.redactValue(tests),
        diagnostics: redactor.redactValue(diagnostics),
        error: redactor.redactValue(serializeYasumuError(error, YasumuErrorCodes.HookExecutionError)),
      };
    } finally {
      await session.dispose();
    }
  }
}
