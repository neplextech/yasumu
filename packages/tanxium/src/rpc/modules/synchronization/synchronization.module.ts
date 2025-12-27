import { Module } from '@yasumu/den';
import { SynchronizationService } from './synchronization.service.ts';
import { YslService } from './ysl.service.ts';
import { WorkspacesModule } from '../workspaces/workspaces.module.ts';
import { EntityGroupModule } from '../entity-group/entity-group.module.ts';
import { RestModule } from '../rest/rest.module.ts';
import { EnvironmentModule } from '../environment/environment.module.ts';
import { EmailModule } from '../email/email.module.ts';
import { SynchronizationResolver } from './synchronization.resolver.ts';
import { LockFileService } from './lock-file.service.ts';
import { ConflictResolver } from './conflict-resolver.ts';

@Module({
  imports: [
    WorkspacesModule,
    RestModule,
    EntityGroupModule,
    EnvironmentModule,
    EmailModule,
  ],
  providers: [
    SynchronizationService,
    YslService,
    LockFileService,
    ConflictResolver,
  ],
  resolvers: [SynchronizationResolver],
  exports: [SynchronizationService, LockFileService],
})
export class SynchronizationModule {}
