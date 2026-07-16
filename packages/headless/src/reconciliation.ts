import type { JsonValue } from '@yasumu/runtime-api';

export type ReconciliationStatus =
  | 'unchanged'
  | 'source-added'
  | 'source-updated'
  | 'source-deleted'
  | 'database-updated'
  | 'auto-merged'
  | 'conflict';

export interface ReconciliationConflict {
  path: string[];
  base: JsonValue | undefined;
  source: JsonValue | undefined;
  database: JsonValue | undefined;
}

export interface ReconciliationResult<T extends JsonValue = JsonValue> {
  status: ReconciliationStatus;
  merged?: T;
  conflicts: ReconciliationConflict[];
  baseRevision?: string;
  sourceRevision?: string;
  databaseRevision?: string;
}

export function reconcileThreeWay<T extends JsonValue>(
  base: T | undefined,
  source: T | undefined,
  database: T | undefined,
): ReconciliationResult<T> {
  const baseRevision = base === undefined ? undefined : stableHash(base);
  const sourceRevision = source === undefined ? undefined : stableHash(source);
  const databaseRevision = database === undefined ? undefined : stableHash(database);

  if (sourceRevision === databaseRevision) {
    return { status: 'unchanged', merged: source, conflicts: [], baseRevision, sourceRevision, databaseRevision };
  }
  if (base === undefined) {
    if (source === undefined) return result('database-updated', database);
    if (database === undefined) return result('source-added', source);
    return conflictAtRoot(base, source, database, baseRevision, sourceRevision, databaseRevision);
  }
  if (source === undefined) {
    if (databaseRevision === baseRevision) return result('source-deleted', undefined);
    return conflictAtRoot(base, source, database, baseRevision, sourceRevision, databaseRevision);
  }
  if (database === undefined) {
    if (sourceRevision === baseRevision) return result('source-deleted', undefined);
    return conflictAtRoot(base, source, database, baseRevision, sourceRevision, databaseRevision);
  }
  if (sourceRevision === baseRevision) return result('database-updated', database);
  if (databaseRevision === baseRevision) return result('source-updated', source);

  const conflicts: ReconciliationConflict[] = [];
  const merged = mergeValue(base, source, database, [], conflicts) as T;
  return {
    status: conflicts.length ? 'conflict' : 'auto-merged',
    merged: conflicts.length ? undefined : merged,
    conflicts,
    baseRevision,
    sourceRevision,
    databaseRevision,
  };

  function result(status: ReconciliationStatus, merged: T | undefined): ReconciliationResult<T> {
    return { status, merged, conflicts: [], baseRevision, sourceRevision, databaseRevision };
  }
}

function conflictAtRoot<T extends JsonValue>(
  base: T | undefined,
  source: T | undefined,
  database: T | undefined,
  baseRevision?: string,
  sourceRevision?: string,
  databaseRevision?: string,
): ReconciliationResult<T> {
  return {
    status: 'conflict',
    conflicts: [{ path: [], base, source, database }],
    baseRevision,
    sourceRevision,
    databaseRevision,
  };
}

function mergeValue(
  base: JsonValue | undefined,
  source: JsonValue | undefined,
  database: JsonValue | undefined,
  path: string[],
  conflicts: ReconciliationConflict[],
): JsonValue | undefined {
  if (isEqual(source, database)) return source;
  if (isEqual(base, source)) return database;
  if (isEqual(base, database)) return source;

  if (isRecord(base) && isRecord(source) && isRecord(database)) {
    const merged: Record<string, JsonValue> = {};
    const keys = new Set([...Object.keys(base), ...Object.keys(source), ...Object.keys(database)]);
    for (const key of [...keys].sort()) {
      const value = mergeValue(base[key], source[key], database[key], [...path, key], conflicts);
      if (value !== undefined) merged[key] = value;
    }
    return merged;
  }

  conflicts.push({ path, base, source, database });
  return undefined;
}

function isRecord(value: JsonValue | undefined): value is Record<string, JsonValue> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isEqual(left: JsonValue | undefined, right: JsonValue | undefined): boolean {
  return stableStringify(left) === stableStringify(right);
}

export function stableHash(value: JsonValue): string {
  const input = stableStringify(value);
  let high = 0x84222325;
  let low = 0xcbf29ce4;
  for (let index = 0; index < input.length; index += 1) {
    low ^= input.charCodeAt(index);
    const nextLow = Math.imul(low, 0x1b3);
    const carry = (nextLow / 0x1_0000_0000) >>> 0;
    high = (Math.imul(high, 0x1b3) + carry) >>> 0;
    low = nextLow >>> 0;
  }
  return high.toString(16).padStart(8, '0') + low.toString(16).padStart(8, '0');
}

export function stableStringify(value: JsonValue | undefined): string {
  if (value === undefined) return 'undefined';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(',')}}`;
}
