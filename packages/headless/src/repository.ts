import type { CookieRepository, WorkspaceCookie } from './cookies.js';
import { YasumuError, YasumuErrorCodes } from './errors.js';
import type { ExecutableEntity, YasumuWorkspace } from './model.js';
import type { EntityRepository, WorkspaceRepository } from './ports.js';

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class InMemoryWorkspaceRepository implements WorkspaceRepository {
  private readonly workspaces = new Map<string, YasumuWorkspace>();

  constructor(initial: YasumuWorkspace[] = []) {
    for (const workspace of initial) this.workspaces.set(workspace.id, clone(workspace));
  }

  async get(workspaceId: string): Promise<YasumuWorkspace | null> {
    const workspace = this.workspaces.get(workspaceId);
    return workspace ? clone(workspace) : null;
  }

  async save(workspace: YasumuWorkspace): Promise<void> {
    validateUniqueEntityIds(workspace.entities);
    this.workspaces.set(workspace.id, clone(workspace));
  }

  async getEntity(workspaceId: string, entityId: string): Promise<ExecutableEntity | null> {
    const workspace = this.workspaces.get(workspaceId);
    const entity = workspace?.entities.find((candidate) => candidate.id === entityId);
    return entity ? clone(entity) : null;
  }

  async list(workspaceId: string, kind?: ExecutableEntity['kind']): Promise<ExecutableEntity[]> {
    const workspace = this.requireWorkspace(workspaceId);
    return clone(kind ? workspace.entities.filter((entity) => entity.kind === kind) : workspace.entities);
  }

  async create(workspaceId: string, entity: ExecutableEntity): Promise<ExecutableEntity> {
    const workspace = this.requireWorkspace(workspaceId);
    if (workspace.entities.some((candidate) => candidate.id === entity.id)) {
      throw new YasumuError(YasumuErrorCodes.DuplicateEntityId, `Entity ID already exists: ${entity.id}`, {
        workspaceId,
        entityId: entity.id,
      });
    }
    assertEntityReferences(workspace, entity);
    workspace.entities.push(clone(entity));
    return clone(entity);
  }

  async update(workspaceId: string, entityId: string, entity: ExecutableEntity): Promise<ExecutableEntity> {
    const workspace = this.requireWorkspace(workspaceId);
    const index = workspace.entities.findIndex((candidate) => candidate.id === entityId);
    if (index < 0) {
      throw new YasumuError(YasumuErrorCodes.EntityNotFound, `Entity not found: ${entityId}`, {
        workspaceId,
        entityId,
      });
    }
    if (entity.id !== entityId) {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, 'Entity IDs are immutable', {
        workspaceId,
        entityId,
      });
    }
    if (workspace.entities[index]!.kind !== entity.kind) {
      throw new YasumuError(YasumuErrorCodes.InvalidEntity, 'Entity kind cannot be changed', {
        workspaceId,
        entityId,
      });
    }
    assertEntityReferences(workspace, entity);
    workspace.entities[index] = clone(entity);
    return clone(entity);
  }

  async delete(workspaceId: string, entityId: string): Promise<void> {
    const workspace = this.requireWorkspace(workspaceId);
    if (workspace.entities.some((entity) => entity.dependencies.includes(entityId))) {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, `Entity ${entityId} is still referenced`, {
        workspaceId,
        entityId,
      });
    }
    workspace.entities = workspace.entities.filter((entity) => entity.id !== entityId);
  }

  private requireWorkspace(workspaceId: string): YasumuWorkspace {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      throw new YasumuError(YasumuErrorCodes.WorkspaceNotFound, `Workspace not found: ${workspaceId}`, {
        workspaceId,
      });
    }
    return workspace;
  }
}

export class InMemoryEntityRepository implements EntityRepository {
  constructor(private readonly repository: InMemoryWorkspaceRepository) {}

  get(workspaceId: string, entityId: string) {
    return this.repository.getEntity(workspaceId, entityId);
  }

  list(workspaceId: string, kind?: ExecutableEntity['kind']) {
    return this.repository.list(workspaceId, kind);
  }

  create(workspaceId: string, entity: ExecutableEntity) {
    return this.repository.create(workspaceId, entity);
  }

  update(workspaceId: string, entityId: string, entity: ExecutableEntity) {
    return this.repository.update(workspaceId, entityId, entity);
  }

  delete(workspaceId: string, entityId: string) {
    return this.repository.delete(workspaceId, entityId);
  }
}

export class InMemoryCookieRepository implements CookieRepository {
  private readonly cookies = new Map<string, WorkspaceCookie>();

  public constructor(initial: WorkspaceCookie[] = []) {
    for (const cookie of initial) this.cookies.set(cookie.id, clone(cookie));
  }

  public async list(workspaceId: string): Promise<WorkspaceCookie[]> {
    return [...this.cookies.values()].filter((cookie) => cookie.workspaceId === workspaceId).map(clone);
  }

  public async upsert(cookie: WorkspaceCookie): Promise<WorkspaceCookie> {
    const conflicting = [...this.cookies.values()].find(
      (candidate) =>
        candidate.workspaceId === cookie.workspaceId &&
        candidate.name === cookie.name &&
        candidate.domain === cookie.domain &&
        candidate.path === cookie.path &&
        candidate.id !== cookie.id,
    );
    if (conflicting) {
      throw new YasumuError(YasumuErrorCodes.InvalidEntity, 'A cookie with this identity already exists');
    }
    const existing = this.cookies.get(cookie.id);
    if (existing && existing.workspaceId !== cookie.workspaceId) {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, `Cookie belongs to another workspace: ${cookie.id}`);
    }
    this.cookies.set(cookie.id, clone(cookie));
    return clone(cookie);
  }

  public async delete(workspaceId: string, cookieId: string): Promise<void> {
    const cookie = this.cookies.get(cookieId);
    if (cookie?.workspaceId === workspaceId) this.cookies.delete(cookieId);
  }

  public async clear(workspaceId: string): Promise<void> {
    for (const cookie of this.cookies.values()) {
      if (cookie.workspaceId === workspaceId) this.cookies.delete(cookie.id);
    }
  }

  public async deleteExpired(workspaceId: string, now: number): Promise<void> {
    for (const cookie of this.cookies.values()) {
      if (cookie.workspaceId === workspaceId && cookie.expiresAt !== null && cookie.expiresAt <= now) {
        this.cookies.delete(cookie.id);
      }
    }
  }
}

export function validateUniqueEntityIds(entities: ExecutableEntity[]): void {
  const seen = new Set<string>();
  for (const entity of entities) {
    if (seen.has(entity.id)) {
      throw new YasumuError(YasumuErrorCodes.DuplicateEntityId, `Duplicate entity ID: ${entity.id}`, {
        entityId: entity.id,
      });
    }
    seen.add(entity.id);
  }
}

function assertEntityReferences(workspace: YasumuWorkspace, entity: ExecutableEntity): void {
  if (entity.workspaceId !== workspace.id) {
    throw new YasumuError(YasumuErrorCodes.InvalidReference, `Entity ${entity.id} belongs to another workspace`, {
      workspaceId: workspace.id,
      entityId: entity.id,
    });
  }
  if (entity.groupId && !workspace.groups.some((group) => group.id === entity.groupId)) {
    throw new YasumuError(YasumuErrorCodes.InvalidReference, `Unknown group: ${entity.groupId}`, {
      workspaceId: workspace.id,
      entityId: entity.id,
    });
  }
  for (const dependency of entity.dependencies) {
    if (!workspace.entities.some((candidate) => candidate.id === dependency)) {
      throw new YasumuError(YasumuErrorCodes.InvalidReference, `Unknown entity dependency: ${dependency}`, {
        workspaceId: workspace.id,
        entityId: entity.id,
      });
    }
  }
}
