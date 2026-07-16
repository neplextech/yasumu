import { Module } from '@yasumu/den';
import { LockFileService, YslService } from '@yasumu/sync';

import { EmailModule } from '../email/email.module.ts';
import { EntityGroupModule } from '../entity-group/entity-group.module.ts';
import { EnvironmentModule } from '../environment/environment.module.ts';
import { GraphqlModule } from '../graphql/graphql.module.ts';
import { RestModule } from '../rest/rest.module.ts';
import { WorkspacesModule } from '../workspaces/workspaces.module.ts';
import { SynchronizationLoader } from './synchronization-loader.service.ts';
import { SynchronizationPusher } from './synchronization-pusher.service.ts';
import { SynchronizationResolver } from './synchronization.resolver.ts';
import { SynchronizationService } from './synchronization.service.ts';

@Module({
  imports: [WorkspacesModule, RestModule, GraphqlModule, EntityGroupModule, EnvironmentModule, EmailModule],
  providers: [SynchronizationService, SynchronizationLoader, SynchronizationPusher, YslService, LockFileService],
  resolvers: [SynchronizationResolver],
  exports: [SynchronizationService, LockFileService],
})
export class SynchronizationModule {}
