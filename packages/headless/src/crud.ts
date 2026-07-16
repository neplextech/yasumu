import type { JsonValue } from '@yasumu/runtime-api';

import { YasumuError, YasumuErrorCodes } from './errors.js';
import type { DomainEvent } from './events.js';
import type {
  ExecutableEntity,
  WorkspaceEnvironment,
  WorkspaceGroup,
  WorkspaceSmtpConfiguration,
  YasumuWorkspace,
} from './model.js';
import type { DomainEventSink, EntityRepository, WorkspaceRepository } from './ports.js';

export class EntityCrudService {
  constructor(
    private readonly entities: EntityRepository,
    private readonly workspaces: WorkspaceRepository,
    private readonly events?: DomainEventSink,
  ) {}

  list(workspaceId: string, kind?: ExecutableEntity['kind']) {
    return this.entities.list(workspaceId, kind);
  }

  get(workspaceId: string, entityId: string) {
    return this.entities.get(workspaceId, entityId);
  }

  async create(workspaceId: string, entity: ExecutableEntity): Promise<ExecutableEntity> {
    const workspace = await this.requireWorkspace(workspaceId);
    validateEntity(workspace, entity);
    const created = await this.entities.create(workspaceId, entity);
    await emit(this.events, { type: 'entity-created', workspaceId, entity: created });
    return created;
  }

  async update(workspaceId: string, entityId: string, entity: ExecutableEntity): Promise<ExecutableEntity> {
    const workspace = await this.requireWorkspace(workspaceId);
    validateEntity(workspace, entity);
    const updated = await this.entities.update(workspaceId, entityId, entity);
    await emit(this.events, { type: 'entity-updated', workspaceId, previousId: entityId, entity: updated });
    return updated;
  }

  async delete(workspaceId: string, entityId: string): Promise<void> {
    await this.entities.delete(workspaceId, entityId);
    await emit(this.events, { type: 'entity-deleted', workspaceId, entityId });
  }

  private async requireWorkspace(workspaceId: string): Promise<YasumuWorkspace> {
    const workspace = await this.workspaces.get(workspaceId);
    if (!workspace) throw new YasumuError(YasumuErrorCodes.WorkspaceNotFound, `Workspace not found: ${workspaceId}`);
    return workspace;
  }
}

export class WorkspaceCrudService {
  constructor(
    private readonly workspaces: WorkspaceRepository,
    private readonly events?: DomainEventSink,
  ) {}

  get(workspaceId: string) {
    return this.workspaces.get(workspaceId);
  }

  async save(workspace: YasumuWorkspace): Promise<void> {
    validateWorkspaceModel(workspace);
    await this.workspaces.save(workspace);
    await emit(this.events, { type: 'workspace-saved', workspace });
  }

  async upsertEnvironment(workspaceId: string, environment: WorkspaceEnvironment): Promise<WorkspaceEnvironment> {
    const workspace = await this.workspaces.get(workspaceId);
    if (!workspace) throw new YasumuError(YasumuErrorCodes.WorkspaceNotFound, `Workspace not found: ${workspaceId}`);
    if (environment.workspaceId !== workspaceId) {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, 'Environment belongs to another workspace');
    }
    const index = workspace.environments.findIndex((candidate) => candidate.id === environment.id);
    if (index < 0) workspace.environments.push(environment);
    else workspace.environments[index] = environment;
    await this.workspaces.save(workspace);
    await emit(this.events, { type: 'environment-upserted', workspaceId, environment });
    return environment;
  }

  async deleteEnvironment(workspaceId: string, environmentId: string): Promise<void> {
    const workspace = await this.requireWorkspace(workspaceId);
    if (!workspace.environments.some((environment) => environment.id === environmentId)) return;
    workspace.environments = workspace.environments.filter((environment) => environment.id !== environmentId);
    if (workspace.activeEnvironmentId === environmentId) workspace.activeEnvironmentId = null;
    await this.workspaces.save(workspace);
    await emit(this.events, { type: 'environment-deleted', workspaceId, environmentId });
  }

  async upsertGroup(workspaceId: string, group: WorkspaceGroup): Promise<WorkspaceGroup> {
    const workspace = await this.requireWorkspace(workspaceId);
    if (group.workspaceId !== workspaceId) {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, 'Group belongs to another workspace');
    }
    if (group.parentId === group.id) {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, 'A group cannot be its own parent');
    }
    if (group.parentId && !workspace.groups.some((candidate) => candidate.id === group.parentId)) {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, `Invalid parent group: ${group.parentId}`);
    }
    const index = workspace.groups.findIndex((candidate) => candidate.id === group.id);
    if (index < 0) workspace.groups.push(group);
    else workspace.groups[index] = group;
    validateGroupGraph(workspace.groups);
    await this.workspaces.save(workspace);
    await emit(this.events, { type: 'group-upserted', workspaceId, group });
    return group;
  }

  async deleteGroup(workspaceId: string, groupId: string): Promise<void> {
    const workspace = await this.requireWorkspace(workspaceId);
    if (workspace.groups.some((group) => group.parentId === groupId)) {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, `Group ${groupId} still contains child groups`);
    }
    if (workspace.entities.some((entity) => entity.groupId === groupId)) {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, `Group ${groupId} still contains entities`);
    }
    if (!workspace.groups.some((group) => group.id === groupId)) return;
    workspace.groups = workspace.groups.filter((group) => group.id !== groupId);
    await this.workspaces.save(workspace);
    await emit(this.events, { type: 'group-deleted', workspaceId, groupId });
  }

  async setWorkspaceScript(workspaceId: string, script: YasumuWorkspace['script']): Promise<void> {
    const workspace = await this.requireWorkspace(workspaceId);
    workspace.script = script;
    await this.workspaces.save(workspace);
    await emit(this.events, { type: 'workspace-script-updated', workspaceId, scriptId: script?.id });
  }

  async setSmtp(workspaceId: string, smtp: WorkspaceSmtpConfiguration | undefined): Promise<void> {
    const workspace = await this.requireWorkspace(workspaceId);
    workspace.smtp = smtp;
    await this.workspaces.save(workspace);
    await emit(this.events, { type: 'workspace-smtp-updated', workspaceId, smtp });
  }

  private async requireWorkspace(workspaceId: string): Promise<YasumuWorkspace> {
    const workspace = await this.workspaces.get(workspaceId);
    if (!workspace) throw new YasumuError(YasumuErrorCodes.WorkspaceNotFound, `Workspace not found: ${workspaceId}`);
    return workspace;
  }
}

function validateWorkspaceModel(workspace: YasumuWorkspace): void {
  const ids = new Set<string>();
  for (const item of [...workspace.groups, ...workspace.environments, ...workspace.entities]) {
    if (ids.has(item.id)) throw new YasumuError(YasumuErrorCodes.DuplicateEntityId, `Duplicate ID: ${item.id}`);
    ids.add(item.id);
  }
  for (const entity of workspace.entities) validateEntity(workspace, entity);
  validateGroupGraph(workspace.groups);
}

function validateGroupGraph(groups: WorkspaceGroup[]): void {
  const byId = new Map(groups.map((group) => [group.id, group]));
  for (const group of groups) {
    const seen = new Set<string>();
    let current: WorkspaceGroup | undefined = group;
    while (current?.parentId) {
      if (seen.has(current.id)) {
        throw new YasumuError(YasumuErrorCodes.InvalidReference, `Group cycle detected at ${current.id}`);
      }
      seen.add(current.id);
      const parent = byId.get(current.parentId);
      if (!parent)
        throw new YasumuError(YasumuErrorCodes.InvalidReference, `Invalid parent group: ${current.parentId}`);
      current = parent;
    }
  }
}

function validateEntity(workspace: YasumuWorkspace, entity: ExecutableEntity): void {
  if (entity.workspaceId !== workspace.id)
    throw new YasumuError(YasumuErrorCodes.InvalidReference, 'Entity belongs to another workspace');
  if (!entity.name.trim()) throw new YasumuError(YasumuErrorCodes.InvalidEntity, 'Entity name is required');
  if (
    entity.groupId &&
    !workspace.groups.some((group) => group.id === entity.groupId && group.entityKind === entity.kind)
  ) {
    throw new YasumuError(YasumuErrorCodes.InvalidReference, `Invalid group reference: ${entity.groupId}`);
  }
  const entityIds = new Set(workspace.entities.map((candidate) => candidate.id));
  for (const dependency of entity.dependencies) {
    if (!entityIds.has(dependency))
      throw new YasumuError(YasumuErrorCodes.InvalidReference, `Invalid dependency: ${dependency}`);
  }
  assertSerializable(entity.metadata);
}

function assertSerializable(value: Record<string, JsonValue>): void {
  try {
    JSON.stringify(value);
  } catch (error) {
    throw new YasumuError(YasumuErrorCodes.InvalidEntity, 'Entity metadata must be serializable', { cause: error });
  }
}

async function emit(sink: DomainEventSink | undefined, event: DomainEvent): Promise<void> {
  if (!sink) return;
  await sink.emit(event);
}
