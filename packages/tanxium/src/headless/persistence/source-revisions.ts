import type { SourceEntityKind } from "@yasumu/common";
import type { SourceOrigin } from "@yasumu/headless";
import type { JsonValue } from "@yasumu/runtime-api";
import { and, eq } from "drizzle-orm";

import { sourceRevisions } from "../../database/schema.ts";
import type { HeadlessDrizzleConnection } from "./database.ts";
import type { SourceRevisionRow } from "./mappers.ts";

export function loadSourceRevisions(
  connection: HeadlessDrizzleConnection,
  workspaceId: string,
): SourceRevisionRow[] {
  return connection.select().from(sourceRevisions).where(
    eq(sourceRevisions.workspaceId, workspaceId),
  ).all();
}

export function loadSourceRevision(
  connection: HeadlessDrizzleConnection,
  workspaceId: string,
  entityKind: SourceEntityKind,
  entityId: string,
): SourceRevisionRow | undefined {
  return connection
    .select()
    .from(sourceRevisions)
    .where(
      and(
        eq(sourceRevisions.workspaceId, workspaceId),
        eq(sourceRevisions.entityKind, entityKind),
        eq(sourceRevisions.entityId, entityId),
      ),
    )
    .get();
}

export function persistSourceRevision(
  connection: HeadlessDrizzleConnection,
  input: {
    workspaceId: string;
    entityKind: SourceEntityKind;
    entityId: string;
    origin: SourceOrigin;
    sourceSnapshot: JsonValue;
    databaseSnapshot?: JsonValue | null;
  },
): void {
  if (
    input.origin.kind !== "ysl" || !input.origin.path || !input.origin.revision
  ) return;

  const updatedAt = Date.now();
  const databaseSnapshot = input.databaseSnapshot === undefined
    ? input.sourceSnapshot
    : input.databaseSnapshot;
  connection
    .insert(sourceRevisions)
    .values({
      workspaceId: input.workspaceId,
      entityKind: input.entityKind,
      entityId: input.entityId,
      sourcePath: input.origin.path,
      sourceRevision: input.origin.revision,
      sourceSnapshot: input.sourceSnapshot,
      databaseSnapshot,
    })
    .onConflictDoUpdate({
      target: [
        sourceRevisions.workspaceId,
        sourceRevisions.entityKind,
        sourceRevisions.entityId,
      ],
      set: {
        sourcePath: input.origin.path,
        sourceRevision: input.origin.revision,
        sourceSnapshot: input.sourceSnapshot,
        databaseSnapshot,
        updatedAt,
      },
    })
    .run();
}
