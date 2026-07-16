import type {
  NestedExecutionSummary,
  PermissionRequest,
  RuntimeHostCallHandler,
  RuntimeHostCalls,
  RuntimeHostMethod,
  ScriptEntity,
} from "@yasumu/runtime-api";

import { YasumuError, YasumuErrorCodes } from "./errors.js";
import type { ExecutableEntity, YasumuWorkspace } from "./model.js";
import type {
  EmailProvider,
  EntityRepository,
  FileResolver,
  PermissionProvider,
} from "./ports.js";

export interface WorkspaceRuntimeHostDependencies {
  entities: EntityRepository;
  email?: EmailProvider;
  files?: FileResolver;
  permissions?: PermissionProvider;
  execute?: (
    request: RuntimeHostCalls["entity.execute"]["input"],
    signal: AbortSignal,
  ) => Promise<NestedExecutionSummary>;
  onPermissionRequest?: (request: PermissionRequest) => void | Promise<void>;
}

export interface WorkspaceRuntimeHostContext {
  workspace: YasumuWorkspace;
  executionId: string;
  entityId: string;
  signal?: AbortSignal;
}

/** Creates the shared workspace API host used by request and email hook sessions. */
export function createWorkspaceRuntimeHost(
  dependencies: WorkspaceRuntimeHostDependencies,
  context: WorkspaceRuntimeHostContext,
): RuntimeHostCallHandler {
  return async <K extends RuntimeHostMethod>(
    method: K,
    value: RuntimeHostCalls[K]["input"],
    signal: AbortSignal,
  ): Promise<RuntimeHostCalls[K]["output"]> => {
    const combined = context.signal
      ? AbortSignal.any([signal, context.signal])
      : signal;
    combined.throwIfAborted();

    switch (method) {
      case "entity.get": {
        const request = value as RuntimeHostCalls["entity.get"]["input"];
        const entity = await dependencies.entities.get(
          context.workspace.id,
          request.id,
        );
        return (entity?.kind === request.kind ? toScriptEntity(entity) : null) as
          RuntimeHostCalls[K]["output"];
      }
      case "entity.list": {
        const request = value as RuntimeHostCalls["entity.list"]["input"];
        const entities = await dependencies.entities.list(
          context.workspace.id,
          request.kind,
        );
        return entities.map(toScriptEntity) as RuntimeHostCalls[K]["output"];
      }
      case "entity.execute": {
        const request = value as RuntimeHostCalls["entity.execute"]["input"];
        const target = await dependencies.entities.get(
          context.workspace.id,
          request.id,
        );
        if (!target) {
          throw hostError(
            YasumuErrorCodes.EntityNotFound,
            `Entity not found: ${request.id}`,
            context,
            request.id,
          );
        }
        if (target.kind !== request.kind) {
          throw hostError(
            YasumuErrorCodes.InvalidEntity,
            `Entity ${request.id} is ${target.kind}, not ${request.kind}`,
            context,
            request.id,
          );
        }
        if (!dependencies.execute) {
          throw hostError(
            YasumuErrorCodes.PermissionDenied,
            "Nested execution capability is unavailable",
            context,
            request.id,
          );
        }
        return await dependencies.execute(request, combined) as
          RuntimeHostCalls[K]["output"];
      }
      case "email.list": {
        if (!dependencies.email) {
          throw hostError(
            YasumuErrorCodes.PermissionDenied,
            "Email capability is unavailable",
            context,
          );
        }
        const request = value as RuntimeHostCalls["email.list"]["input"];
        const emails = await dependencies.email.list(
          context.workspace.id,
          request,
          combined,
        );
        return { emails } as RuntimeHostCalls[K]["output"];
      }
      case "email.next": {
        if (!dependencies.email) {
          throw hostError(
            YasumuErrorCodes.PermissionDenied,
            "Email capability is unavailable",
            context,
          );
        }
        const request = value as RuntimeHostCalls["email.next"]["input"];
        return await dependencies.email.next(
          context.workspace.id,
          request,
          combined,
        ) as RuntimeHostCalls[K]["output"];
      }
      case "file.resolve": {
        if (!dependencies.files) {
          throw hostError(
            YasumuErrorCodes.FileAccessDenied,
            "File capability is unavailable",
            context,
          );
        }
        const request = value as RuntimeHostCalls["file.resolve"]["input"];
        return await dependencies.files.resolve(context.workspace, request.path) as
          RuntimeHostCalls[K]["output"];
      }
      case "file.open": {
        if (!dependencies.files) {
          throw hostError(
            YasumuErrorCodes.FileAccessDenied,
            "File capability is unavailable",
            context,
          );
        }
        const request = value as RuntimeHostCalls["file.open"]["input"];
        const opened = await dependencies.files.open(
          context.workspace,
          request.reference,
          combined,
        );
        return {
          file: opened.file,
          bytes: [...new Uint8Array(await opened.blob.arrayBuffer())],
        } as RuntimeHostCalls[K]["output"];
      }
      case "permission.request": {
        const request = value as PermissionRequest;
        await dependencies.onPermissionRequest?.(request);
        const granted = dependencies.permissions
          ? await dependencies.permissions.request(request, combined)
          : false;
        return { granted } as RuntimeHostCalls[K]["output"];
      }
      default:
        throw hostError(
          YasumuErrorCodes.ScriptRuntimeError,
          `Unsupported runtime host call: ${String(method)}`,
          context,
        );
    }
  };
}

export function toScriptEntity(entity: ExecutableEntity): ScriptEntity {
  return {
    id: entity.id,
    name: entity.name,
    kind: entity.kind,
    groupId: entity.groupId,
    metadata: entity.metadata,
  };
}

function hostError(
  code: (typeof YasumuErrorCodes)[keyof typeof YasumuErrorCodes],
  message: string,
  context: WorkspaceRuntimeHostContext,
  entityId = context.entityId,
): YasumuError {
  return new YasumuError(code, message, {
    workspaceId: context.workspace.id,
    entityId,
    executionId: context.executionId,
  });
}
