import type {
  JsonValue,
  PermissionRequest,
  ResolvedScriptFile,
  WorkspaceEmail,
  YasumuFileReference,
} from '@yasumu/runtime-api';

import type { DomainEvent, ExecutionEvent } from './events.js';
import type { ExecutableEntity, ExecutionRecord, YasumuWorkspace } from './model.js';

export interface WorkspaceRepository {
  get(workspaceId: string): Promise<YasumuWorkspace | null>;
  save(workspace: YasumuWorkspace): Promise<void>;
}

export interface EntityRepository {
  get(workspaceId: string, entityId: string): Promise<ExecutableEntity | null>;
  list(workspaceId: string, kind?: ExecutableEntity['kind']): Promise<ExecutableEntity[]>;
  create(workspaceId: string, entity: ExecutableEntity): Promise<ExecutableEntity>;
  update(workspaceId: string, entityId: string, entity: ExecutableEntity): Promise<ExecutableEntity>;
  delete(workspaceId: string, entityId: string): Promise<void>;
}

export interface SecretProvider {
  resolve(workspace: YasumuWorkspace, environmentId?: string): Promise<Record<string, string>>;
}

export interface FileOpenResult {
  file: ResolvedScriptFile;
  blob: Blob;
}

export interface FileResolver {
  resolve(workspace: YasumuWorkspace, path: string): Promise<ResolvedScriptFile>;
  open(workspace: YasumuWorkspace, reference: YasumuFileReference, signal?: AbortSignal): Promise<FileOpenResult>;
}

export interface RequestTransportContext {
  workspace: YasumuWorkspace;
  entity: ExecutableEntity;
  executionId: string;
  timeoutMs?: number;
  followRedirects?: boolean;
}

export interface RequestTransport {
  send(request: Request, context: RequestTransportContext, signal: AbortSignal): Promise<Response>;
}

export interface EmailProvider {
  list(workspaceId: string, options: { since: number; limit?: number }, signal?: AbortSignal): Promise<WorkspaceEmail[]>;
  next(
    workspaceId: string,
    options: { since: number; cursor?: string; timeoutMs?: number },
    signal: AbortSignal,
  ): Promise<{ email: WorkspaceEmail | null; cursor?: string }>;
}

export interface PermissionProvider {
  request(request: PermissionRequest, signal: AbortSignal): Promise<boolean>;
}

export interface ExecutionEventSink {
  emit(event: ExecutionEvent): void | Promise<void>;
}

export interface DomainEventSink {
  emit(event: DomainEvent): void | Promise<void>;
}

export interface ExecutionHistoryRepository {
  save(record: ExecutionRecord): Promise<void>;
}

export interface Clock {
  now(): number;
}

export interface IdGenerator {
  generate(): string;
}

export interface WorkspaceSourceFile {
  path: string;
  content: string;
  revision?: string;
}

export interface WorkspaceSource {
  readonly root?: string;
  list(): Promise<WorkspaceSourceFile[]>;
}

export interface SourceSnapshotStore {
  get(workspaceId: string, sourcePath: string): Promise<JsonValue | null>;
  set(workspaceId: string, sourcePath: string, snapshot: JsonValue): Promise<void>;
  delete(workspaceId: string, sourcePath: string): Promise<void>;
}

export const systemClock: Clock = { now: () => Date.now() };

export class WebFetchTransport implements RequestTransport {
  async send(request: Request, context: RequestTransportContext, signal: AbortSignal): Promise<Response> {
    return fetch(
      new Request(request, {
        signal,
        redirect: context.followRedirects === false ? 'manual' : 'follow',
      }),
    );
  }
}

export const noopEventSink: ExecutionEventSink = { emit: () => undefined };
