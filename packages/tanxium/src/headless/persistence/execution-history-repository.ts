import type { ExecutionHistoryRepository, ExecutionRecord } from '@yasumu/headless';

import { executionHistory } from '../../database/schema.ts';
import type { HeadlessDrizzleDatabase } from './database.ts';
import { serializableSnapshot } from './mappers.ts';

export class DrizzleExecutionHistoryRepository implements ExecutionHistoryRepository {
  public constructor(private readonly database: HeadlessDrizzleDatabase) {}

  // Drizzle's Node SQLite driver is synchronous while the headless port is asynchronous.
  // deno-lint-ignore require-await
  public async save(record: ExecutionRecord): Promise<void> {
    const result = serializableSnapshot({
      result: record.result,
      tests: record.tests,
    });
    this.database
      .insert(executionHistory)
      .values({
        executionId: record.id,
        parentExecutionId: record.parentId ?? null,
        rootExecutionId: record.rootId,
        workspaceId: record.workspaceId,
        entityId: record.entityId,
        kind: record.entityKind,
        status: record.status,
        startedAt: record.startedAt,
        completedAt: record.completedAt,
        durationMs: record.durationMs,
        result,
      })
      .onConflictDoUpdate({
        target: executionHistory.executionId,
        set: {
          parentExecutionId: record.parentId ?? null,
          rootExecutionId: record.rootId,
          workspaceId: record.workspaceId,
          entityId: record.entityId,
          kind: record.entityKind,
          status: record.status,
          startedAt: record.startedAt,
          completedAt: record.completedAt,
          durationMs: record.durationMs,
          result,
        },
      })
      .run();
  }
}
