import {
  createWorkspaceRuntimeHost,
  EmailHookService,
  type EmailHookResult,
  type EmailProvider,
  type EntityRepository,
  type FileResolver,
  type HeadlessExecutionService,
  type PermissionProvider,
  type WorkspaceRepository,
  type YasumuWorkspace,
} from "@yasumu/headless";
import type {
  WorkspaceEmail,
  YasumuScriptRuntime,
} from "@yasumu/runtime-api";

export interface GuiEmailHookDependencies {
  workspaces: WorkspaceRepository;
  entities: EntityRepository;
  runtime: YasumuScriptRuntime;
  execution: HeadlessExecutionService;
  email: EmailProvider;
  files: FileResolver;
  permissions: PermissionProvider;
}

/** Runs incoming SMTP hooks through the same runtime and workspace host APIs as requests. */
export class GuiEmailHookService {
  public constructor(private readonly dependencies: GuiEmailHookDependencies) {}

  public async handle(
    workspaceId: string,
    email: WorkspaceEmail,
    signal?: AbortSignal,
  ): Promise<EmailHookResult> {
    const workspace = await this.dependencies.workspaces.get(workspaceId) ??
      missingWorkspace(workspaceId);
    const hostCall = createWorkspaceRuntimeHost(
      {
        entities: this.dependencies.entities,
        email: this.dependencies.email,
        files: this.dependencies.files,
        permissions: this.dependencies.permissions,
        execute: async (request, nestedSignal) => {
          const result = await this.dependencies.execution.execute({
            workspaceId,
            entityId: request.id,
            environmentId: request.options?.environmentId,
            variables: request.options?.variables,
            secrets: request.options?.secrets,
            mode: request.options?.runTests ? "test" : "run",
            options: { timeoutMs: request.options?.timeoutMs },
            signal: nestedSignal,
          });
          return {
            executionId: result.executionId,
            entityId: result.entityId,
            status: result.status,
            response: request.options?.withResponse
              ? result.response
              : undefined,
            tests: result.tests,
            logs: result.logs,
            diagnostics: result.diagnostics,
            error: result.error,
          };
        },
      },
      {
        workspace,
        executionId: `email:${email.id}`,
        entityId: workspace.smtp?.id ?? workspace.id,
        signal,
      },
    );
    return new EmailHookService({
      workspaces: this.dependencies.workspaces,
      runtime: this.dependencies.runtime,
      hostCall,
    }).handle(workspaceId, email, signal);
  }
}

function missingWorkspace(workspaceId: string): YasumuWorkspace {
  return {
    id: workspaceId,
    name: workspaceId,
    version: 1,
    activeEnvironmentId: null,
    entities: [],
    groups: [],
    environments: [],
    metadata: {},
    origin: { kind: "memory" },
  };
}
