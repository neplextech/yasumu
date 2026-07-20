export * from './database.ts';
export * from './cookie-repository.ts';
export * from './email-provider.ts';
export * from './entity-repository.ts';
export * from './environment-repository.ts';
export * from './execution-history-repository.ts';
export * from './workspace-repository.ts';

import { DrizzleCookieRepository } from './cookie-repository.ts';
import type { HeadlessDrizzleDatabase } from './database.ts';
import { DrizzleEmailProvider } from './email-provider.ts';
import { DrizzleEntityRepository } from './entity-repository.ts';
import { DrizzleEnvironmentRepository } from './environment-repository.ts';
import { DrizzleExecutionHistoryRepository } from './execution-history-repository.ts';
import { DrizzleWorkspaceRepository } from './workspace-repository.ts';

export function createDrizzleHeadlessPersistence(database: HeadlessDrizzleDatabase) {
  return {
    workspaces: new DrizzleWorkspaceRepository(database),
    entities: new DrizzleEntityRepository(database),
    environments: new DrizzleEnvironmentRepository(database),
    email: new DrizzleEmailProvider(database),
    history: new DrizzleExecutionHistoryRepository(database),
    cookies: new DrizzleCookieRepository(database),
  };
}
