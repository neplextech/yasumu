import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join, sep } from 'node:path';

import type { SourceEntityKind, WorkspaceData } from '@yasumu/common';
import {
  type ExecutableEntity,
  HeadlessWorkspaceLoader,
  reconcileThreeWay,
  type ReconciliationConflict,
  type ReconciliationResult,
  type ReconciliationStatus,
  type RestEntity,
  type SourceOrigin,
  stableHash,
  stableStringify,
  type WorkspaceEnvironment,
  type WorkspaceGroup,
  type WorkspaceSmtpConfiguration,
  type WorkspaceSource,
  type WorkspaceSourceFile,
  WorkspaceValidationError,
  YasumuError,
  YasumuErrorCodes,
  type YasumuWorkspace,
} from '@yasumu/headless';
import type { JsonValue, ScriptSource } from '@yasumu/runtime-api';
import { and, eq } from 'drizzle-orm';

import { sourceRevisions, workspaces } from '../../../database/schema.ts';
import type { HeadlessDrizzleDatabase } from '../../../headless/persistence/database.ts';
import {
  safeEnvironmentSnapshot,
  safeSmtpSnapshot,
  serializableSnapshot,
} from '../../../headless/persistence/mappers.ts';
import { loadSourceRevisions, persistSourceRevision } from '../../../headless/persistence/source-revisions.ts';
import { DrizzleWorkspaceRepository } from '../../../headless/persistence/workspace-repository.ts';

export type ReconciledSourceKind = Extract<
  SourceEntityKind,
  'workspace' | 'entity-group' | 'rest' | 'graphql' | 'environment' | 'smtp'
>;

export interface SourceReconciliationEntry {
  kind: ReconciledSourceKind;
  entityId: string;
  sourcePath?: string;
  status: ReconciliationStatus;
  conflicts: ReconciliationConflict[];
  baseRevision?: string;
  sourceRevision?: string;
  databaseRevision?: string;
}

export interface WorkspaceReconciliationReport {
  workspaceId: string;
  entries: SourceReconciliationEntry[];
  conflicts: ReconciliationConflict[];
}

export class WorkspaceReconciliationConflictError extends YasumuError {
  public constructor(readonly report: WorkspaceReconciliationReport) {
    super(
      YasumuErrorCodes.ReconciliationConflict,
      `Workspace reconciliation found ${report.conflicts.length} conflict${report.conflicts.length === 1 ? '' : 's'}`,
      {
        workspaceId: report.workspaceId,
        details: serializableSnapshot(report),
      },
    );
    this.name = 'WorkspaceReconciliationConflictError';
  }
}

/** SQLite/YSL reconciliation boundary used by the desktop synchronization module. */
export class GuiWorkspaceReconciler {
  readonly #repository: DrizzleWorkspaceRepository;

  public constructor(
    private readonly database: HeadlessDrizzleDatabase,
    private readonly loader = new HeadlessWorkspaceLoader(),
  ) {
    this.#repository = new DrizzleWorkspaceRepository(database);
  }

  public async importWorkspace(root: string): Promise<WorkspaceData> {
    const source = await this.loadSource(root);
    if (await this.#repository.get(source.id)) {
      throw new YasumuError(YasumuErrorCodes.DuplicateEntityId, `Workspace already exists: ${source.id}`, {
        workspaceId: source.id,
      });
    }
    await this.#repository.save(source);
    const persistedWorkspace = await this.#repository.get(source.id);
    if (!persistedWorkspace) {
      throw new YasumuError(YasumuErrorCodes.WorkspaceNotFound, `Workspace import failed: ${source.id}`, {
        workspaceId: source.id,
      });
    }
    persistReconciliationBaselines(
      this.database,
      source.id,
      recordsFromWorkspace(source),
      recordsFromWorkspace(persistedWorkspace),
      new Map(),
    );
    const row = this.database.select().from(workspaces).where(eq(workspaces.id, source.id)).get();
    if (!row) {
      throw new YasumuError(YasumuErrorCodes.WorkspaceNotFound, `Workspace import failed: ${source.id}`, {
        workspaceId: source.id,
      });
    }
    return row;
  }

  public async reconcile(workspaceId: string, root: string): Promise<WorkspaceReconciliationReport> {
    const [source, databaseWorkspace] = await Promise.all([this.loadSource(root), this.#repository.get(workspaceId)]);
    if (!databaseWorkspace) {
      throw new YasumuError(YasumuErrorCodes.WorkspaceNotFound, `Workspace not found: ${workspaceId}`, {
        workspaceId,
      });
    }
    if (source.id !== workspaceId) {
      throw new YasumuError(
        YasumuErrorCodes.InvalidReference,
        `workspace.ysl declares ${source.id}, but the active workspace is ${workspaceId}`,
        { workspaceId, file: source.origin.path },
      );
    }

    const sourceRecords = recordsFromWorkspace(source);
    const databaseRecords = recordsFromWorkspace(databaseWorkspace);
    const revisionRows = loadSourceRevisions(this.database, workspaceId);
    const revisions = new Map(
      revisionRows.flatMap((revision) =>
        isReconciledKind(revision.entityKind)
          ? [[recordKey(revision.entityKind, revision.entityId), revision] as const]
          : [],
      ),
    );
    const keys = new Set([...sourceRecords.keys(), ...databaseRecords.keys(), ...revisions.keys()]);
    const decisions: ReconciliationDecision[] = [];

    for (const key of [...keys].sort(compareRecordKeys)) {
      const sourceRecord = sourceRecords.get(key);
      const databaseRecord = databaseRecords.get(key);
      const revision = revisions.get(key);
      const kind = sourceRecord?.kind ?? databaseRecord?.kind ?? revision?.entityKind;
      const entityId = sourceRecord?.entityId ?? databaseRecord?.entityId ?? revision?.entityId;
      if (!kind || !entityId || !isReconciledKind(kind)) continue;

      let result = reconcileRecord(revision, sourceRecord, databaseRecord);
      // Removing SMTP configuration would cascade the persisted mailbox. Keep it explicit.
      if (kind === 'smtp' && revision && !sourceRecord && databaseRecord && result.status === 'source-deleted') {
        result = rootConflict(revision.sourceSnapshot, undefined, databaseRecord.snapshot);
      }
      decisions.push({
        kind,
        entityId,
        source: sourceRecord,
        database: databaseRecord,
        revision,
        result,
      });
    }

    const entries = decisions.map(toReportEntry);
    const conflicts = entries.flatMap((entry) => entry.conflicts);
    if (conflicts.length > 0) return { workspaceId, entries, conflicts };

    const desired = structuredClone(databaseWorkspace);
    let databaseWriteRequired = false;
    for (const decision of decisions) {
      if (
        decision.result.status === 'source-added' ||
        decision.result.status === 'source-updated' ||
        decision.result.status === 'auto-merged'
      ) {
        applySnapshot(desired, decision, decision.result.merged!);
        databaseWriteRequired = true;
      } else if (decision.result.status === 'source-deleted') {
        removeRecord(desired, decision.kind, decision.entityId);
        databaseWriteRequired = true;
      }
    }
    if (
      desired.activeEnvironmentId &&
      !desired.environments.some((environment) => environment.id === desired.activeEnvironmentId)
    ) {
      desired.activeEnvironmentId = null;
    }

    const integrity = referenceConflicts(desired);
    if (integrity.length > 0) {
      return { workspaceId, entries, conflicts: integrity };
    }

    if (databaseWriteRequired) {
      await this.#repository.save(desired);
    }

    const persistedWorkspace = await this.#repository.get(workspaceId);
    if (!persistedWorkspace) {
      throw new YasumuError(
        YasumuErrorCodes.WorkspaceNotFound,
        `Workspace disappeared during reconciliation: ${workspaceId}`,
      );
    }
    const persistedRecords = recordsFromWorkspace(persistedWorkspace);
    persistReconciliationBaselines(this.database, workspaceId, sourceRecords, persistedRecords, revisions);
    return { workspaceId, entries, conflicts: [] };
  }

  private async loadSource(root: string): Promise<YasumuWorkspace> {
    const result = await this.loader.load(new GuiYslWorkspaceSource(root));
    if (!result.workspace) {
      throw new WorkspaceValidationError('The Yasumu workspace is invalid', result.diagnostics);
    }
    return result.workspace;
  }
}

class GuiYslWorkspaceSource implements WorkspaceSource {
  public constructor(readonly root: string) {}

  public async list(): Promise<WorkspaceSourceFile[]> {
    const yslRoot = join(this.root, 'yasumu');
    if (!existsSync(yslRoot)) return [];
    const files = await listFiles(yslRoot);
    return Promise.all(
      files
        .filter((path) => path.endsWith('.ysl'))
        .sort((left, right) => left.localeCompare(right))
        .map(async (path) => ({
          path: join('yasumu', path).split(sep).join('/'),
          content: await readFile(join(yslRoot, path), 'utf8'),
        })),
    );
  }
}

async function listFiles(root: string, prefix = ''): Promise<string[]> {
  const directory = join(root, prefix);
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = prefix ? join(prefix, entry.name) : entry.name;
    if (entry.isDirectory()) files.push(...(await listFiles(root, path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

type ManagedValue =
  | YasumuWorkspace
  | WorkspaceGroup
  | ExecutableEntity
  | WorkspaceEnvironment
  | WorkspaceSmtpConfiguration;

interface ManagedRecord {
  kind: ReconciledSourceKind;
  entityId: string;
  origin: SourceOrigin;
  snapshot: JsonValue;
  value: ManagedValue;
}

interface ReconciliationDecision {
  kind: ReconciledSourceKind;
  entityId: string;
  source?: ManagedRecord;
  database?: ManagedRecord;
  revision?: ReturnType<typeof loadSourceRevisions>[number];
  result: ReconciliationResult;
}

function recordsFromWorkspace(workspace: YasumuWorkspace): Map<string, ManagedRecord> {
  const records = new Map<string, ManagedRecord>();
  add('workspace', workspace.id, workspace.origin, workspaceSnapshot(workspace), workspace);
  for (const group of workspace.groups) {
    add('entity-group', group.id, group.origin, groupSnapshot(group), group);
  }
  for (const entity of workspace.entities) {
    add(entity.kind, entity.id, entity.origin, entitySnapshot(entity), entity);
  }
  for (const environment of workspace.environments) {
    add('environment', environment.id, environment.origin, safeEnvironmentSnapshot(environment), environment);
  }
  if (workspace.smtp) {
    add('smtp', workspace.smtp.id, workspace.smtp.origin, safeSmtpSnapshot(workspace.smtp), workspace.smtp);
  }
  return records;

  function add(
    kind: ReconciledSourceKind,
    entityId: string,
    origin: SourceOrigin,
    snapshot: JsonValue,
    value: ManagedValue,
  ): void {
    records.set(recordKey(kind, entityId), {
      kind,
      entityId,
      origin,
      snapshot,
      value,
    });
  }
}

function workspaceSnapshot(workspace: YasumuWorkspace): JsonValue {
  return serializableSnapshot({
    id: workspace.id,
    name: workspace.name,
    version: workspace.version,
    script: workspace.script?.code ?? null,
  });
}

function groupSnapshot(group: WorkspaceGroup): JsonValue {
  return serializableSnapshot({
    id: group.id,
    name: group.name,
    parentId: group.parentId,
    entityKind: group.entityKind,
    script: group.script?.code ?? null,
  });
}

function entitySnapshot(entity: ExecutableEntity): JsonValue {
  return serializableSnapshot({
    kind: entity.kind,
    id: entity.id,
    name: entity.name,
    groupId: entity.groupId,
    method: entity.kind === 'rest' ? entity.method : null,
    url: entity.url,
    headers: entity.headers,
    pathParameters: entity.pathParameters,
    searchParameters: entity.searchParameters,
    body: entity.body,
    lifecycleScript: entity.scripts.lifecycle?.code ?? null,
    testScript: entity.scripts.test?.code ?? null,
    dependencies: entity.dependencies,
  });
}

function reconcileRecord(
  revision: ReturnType<typeof loadSourceRevisions>[number] | undefined,
  source: ManagedRecord | undefined,
  database: ManagedRecord | undefined,
): ReconciliationResult {
  if (
    revision &&
    equalSnapshot(source?.snapshot, revision.sourceSnapshot) &&
    equalSnapshot(database?.snapshot, revision.databaseSnapshot ?? undefined)
  ) {
    return {
      status: 'unchanged',
      merged: database?.snapshot,
      conflicts: [],
      baseRevision: stableRevision(revision.sourceSnapshot),
      sourceRevision: stableRevision(source?.snapshot),
      databaseRevision: stableRevision(database?.snapshot),
    };
  }
  if (
    revision &&
    source &&
    !database &&
    equalSnapshot(source.snapshot, revision.sourceSnapshot) &&
    revision.databaseSnapshot !== null
  ) {
    return {
      status: 'database-updated',
      conflicts: [],
      baseRevision: stableRevision(revision.sourceSnapshot),
      sourceRevision: stableRevision(source.snapshot),
    };
  }
  return reconcileThreeWay(revision?.sourceSnapshot, source?.snapshot, database?.snapshot);
}

function rootConflict(base: JsonValue | undefined, source: JsonValue | undefined, database: JsonValue | undefined) {
  return {
    status: 'conflict' as const,
    conflicts: [{ path: [], base, source, database }],
    baseRevision: stableRevision(base),
    sourceRevision: stableRevision(source),
    databaseRevision: stableRevision(database),
  } satisfies ReconciliationResult;
}

function toReportEntry(decision: ReconciliationDecision): SourceReconciliationEntry {
  return {
    kind: decision.kind,
    entityId: decision.entityId,
    sourcePath: decision.source?.origin.path ?? decision.revision?.sourcePath,
    status: decision.result.status,
    conflicts: decision.result.conflicts,
    baseRevision: decision.result.baseRevision,
    sourceRevision: decision.result.sourceRevision,
    databaseRevision: decision.result.databaseRevision,
  };
}

function applySnapshot(workspace: YasumuWorkspace, decision: ReconciliationDecision, snapshot: JsonValue): void {
  const origin = decision.source?.origin ?? decision.database?.origin ?? { kind: 'sqlite' as const };
  switch (decision.kind) {
    case 'workspace': {
      const data = snapshot as unknown as WorkspaceRecordSnapshot;
      workspace.name = data.name;
      workspace.version = data.version;
      workspace.script = scriptSource(data.script, `workspace:${workspace.id}`, origin);
      workspace.origin = origin;
      return;
    }
    case 'entity-group': {
      const data = snapshot as unknown as GroupRecordSnapshot;
      const group: WorkspaceGroup = {
        id: data.id,
        name: data.name,
        workspaceId: workspace.id,
        parentId: data.parentId,
        entityKind: data.entityKind,
        script: scriptSource(data.script, `group:${data.id}`, origin),
        origin,
      };
      replaceById(workspace.groups, group);
      return;
    }
    case 'rest':
    case 'graphql': {
      const data = snapshot as unknown as EntityRecordSnapshot;
      const existing = workspace.entities.find((entity) => entity.id === data.id);
      const metadata = existing?.metadata ?? {};
      const scripts = {
        lifecycle: scriptSource(data.lifecycleScript, `${data.kind}:${data.id}:lifecycle`, origin),
        test: scriptSource(data.testScript, `${data.kind}:${data.id}:test`, origin),
      };
      const common = {
        id: data.id,
        name: data.name,
        workspaceId: workspace.id,
        groupId: data.groupId,
        headers: data.headers,
        pathParameters: data.pathParameters,
        searchParameters: data.searchParameters,
        url: data.url,
        scripts,
        dependencies: data.dependencies,
        metadata,
        origin,
      };
      const entity: ExecutableEntity =
        data.kind === 'rest'
          ? {
              ...common,
              kind: 'rest',
              method: data.method ?? 'GET',
              body: data.body as RestEntity['body'],
            }
          : {
              ...common,
              kind: 'graphql',
              body: data.body as Extract<ExecutableEntity, { kind: 'graphql' }>['body'],
            };
      replaceById(workspace.entities, entity);
      return;
    }
    case 'environment': {
      const data = snapshot as unknown as EnvironmentRecordSnapshot;
      const existing = workspace.environments.find((environment) => environment.id === data.id);
      const secretValues = new Map(existing?.secrets.map((secret) => [secret.key, secret.value]));
      const environment: WorkspaceEnvironment = {
        id: data.id,
        workspaceId: workspace.id,
        name: data.name,
        variables: data.variables,
        secrets: data.secrets.map((secret) => ({
          ...secret,
          value: secretValues.get(secret.key),
        })),
        origin,
      };
      replaceById(workspace.environments, environment);
      return;
    }
    case 'smtp': {
      const data = snapshot as unknown as SmtpRecordSnapshot;
      workspace.smtp = {
        id: data.id,
        port: data.port,
        username: data.username,
        password: workspace.smtp?.password,
        script: scriptSource(data.script, `smtp:${data.id}`, origin),
        origin,
      };
    }
  }
}

function removeRecord(workspace: YasumuWorkspace, kind: ReconciledSourceKind, entityId: string): void {
  switch (kind) {
    case 'workspace':
      throw new YasumuError(YasumuErrorCodes.ReconciliationConflict, 'workspace.ysl cannot be deleted implicitly');
    case 'entity-group':
      workspace.groups = workspace.groups.filter((group) => group.id !== entityId);
      return;
    case 'rest':
    case 'graphql':
      workspace.entities = workspace.entities.filter((entity) => entity.id !== entityId);
      return;
    case 'environment':
      workspace.environments = workspace.environments.filter((environment) => environment.id !== entityId);
      return;
    case 'smtp':
      workspace.smtp = undefined;
  }
}

function referenceConflicts(workspace: YasumuWorkspace): ReconciliationConflict[] {
  const conflicts: ReconciliationConflict[] = [];
  const groups = new Map(workspace.groups.map((group) => [group.id, group]));
  const entities = new Map(workspace.entities.map((entity) => [entity.id, entity]));
  for (const entity of workspace.entities) {
    if (entity.groupId && groups.get(entity.groupId)?.entityKind !== entity.kind) {
      conflicts.push({
        path: ['entities', entity.id, 'groupId'],
        base: entity.groupId,
        source: undefined,
        database: entity.groupId,
      });
    }
    for (const dependency of entity.dependencies) {
      if (entities.get(dependency)?.kind !== entity.kind) {
        conflicts.push({
          path: ['entities', entity.id, 'dependencies'],
          base: dependency,
          source: undefined,
          database: dependency,
        });
      }
    }
  }
  return conflicts;
}

function persistReconciliationBaselines(
  database: HeadlessDrizzleDatabase,
  workspaceId: string,
  source: Map<string, ManagedRecord>,
  persisted: Map<string, ManagedRecord>,
  previous: Map<string, ReturnType<typeof loadSourceRevisions>[number]>,
): void {
  for (const [key, sourceRecord] of source) {
    persistSourceRevision(database, {
      workspaceId,
      entityKind: sourceRecord.kind,
      entityId: sourceRecord.entityId,
      origin: sourceRecord.origin,
      sourceSnapshot: sourceRecord.snapshot,
      databaseSnapshot: persisted.get(key)?.snapshot ?? null,
    });
  }
  for (const [key, revision] of previous) {
    if (source.has(key)) continue;
    database
      .delete(sourceRevisions)
      .where(
        and(
          eq(sourceRevisions.workspaceId, workspaceId),
          eq(sourceRevisions.entityKind, revision.entityKind),
          eq(sourceRevisions.entityId, revision.entityId),
        ),
      )
      .run();
  }
}

function scriptSource(code: string | null, id: string, origin: SourceOrigin): ScriptSource | undefined {
  return code?.trim() ? { id, code, sourceUrl: origin.path } : undefined;
}

function replaceById<T extends { id: string }>(values: T[], value: T): void {
  const index = values.findIndex((candidate) => candidate.id === value.id);
  if (index < 0) values.push(value);
  else values[index] = value;
}

function recordKey(kind: ReconciledSourceKind, entityId: string): string {
  return `${kind}:${entityId}`;
}

function compareRecordKeys(left: string, right: string): number {
  const priority = ['workspace:', 'entity-group:', 'environment:', 'rest:', 'graphql:', 'smtp:'];
  const leftPriority = priority.findIndex((prefix) => left.startsWith(prefix));
  const rightPriority = priority.findIndex((prefix) => right.startsWith(prefix));
  return leftPriority - rightPriority || left.localeCompare(right);
}

function isReconciledKind(value: SourceEntityKind): value is ReconciledSourceKind {
  return (
    value === 'workspace' ||
    value === 'entity-group' ||
    value === 'rest' ||
    value === 'graphql' ||
    value === 'environment' ||
    value === 'smtp'
  );
}

function equalSnapshot(left: JsonValue | undefined, right: JsonValue | undefined): boolean {
  return stableStringify(left) === stableStringify(right);
}

function stableRevision(value: JsonValue | undefined): string | undefined {
  return value === undefined ? undefined : stableHash(value);
}

interface WorkspaceRecordSnapshot {
  id: string;
  name: string;
  version: number;
  script: string | null;
}

interface GroupRecordSnapshot {
  id: string;
  name: string;
  parentId: string | null;
  entityKind: WorkspaceGroup['entityKind'];
  script: string | null;
}

interface EntityRecordSnapshot {
  kind: ExecutableEntity['kind'];
  id: string;
  name: string;
  groupId: string | null;
  method: string | null;
  url: string | null;
  headers: ExecutableEntity['headers'];
  pathParameters: ExecutableEntity['pathParameters'];
  searchParameters: ExecutableEntity['searchParameters'];
  body: ExecutableEntity['body'];
  lifecycleScript: string | null;
  testScript: string | null;
  dependencies: string[];
}

interface EnvironmentRecordSnapshot {
  id: string;
  name: string;
  variables: WorkspaceEnvironment['variables'];
  secrets: Array<{ key: string; enabled: boolean }>;
}

interface SmtpRecordSnapshot {
  id: string;
  port: number;
  username?: string | null;
  script: string | null;
}
