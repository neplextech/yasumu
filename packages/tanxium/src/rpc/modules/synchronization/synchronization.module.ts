import { Module } from '@yasumu/den';

import { EmailModule } from '../email/email.module.ts';
import { EntityGroupModule } from '../entity-group/entity-group.module.ts';
import { EnvironmentModule } from '../environment/environment.module.ts';
import { GraphqlModule } from '../graphql/graphql.module.ts';
import { RestModule } from '../rest/rest.module.ts';
import { WorkspacesModule } from '../workspaces/workspaces.module.ts';
import { ConflictResolver } from './conflict-resolver.ts';
import { LockFileService } from './lock-file.service.ts';
import { SynchronizationResolver } from './synchronization.resolver.ts';
import { SynchronizationService } from './synchronization.service.ts';
import { YslService } from './ysl.service.ts';

@Module({
  imports: [WorkspacesModule, RestModule, GraphqlModule, EntityGroupModule, EnvironmentModule, EmailModule],
  providers: [SynchronizationService, YslService, LockFileService, ConflictResolver],
  resolvers: [SynchronizationResolver],
  exports: [SynchronizationService, LockFileService],
})
export class SynchronizationModule {}
