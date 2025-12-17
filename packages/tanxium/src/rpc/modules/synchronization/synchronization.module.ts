import { Module } from '@yasumu/den';
import { SynchronizationService } from './synchronization.service.ts';
import { YslService } from './ysl.service.ts';
import { WorkspacesModule } from '../workspaces/workspaces.module.ts';
import { EntityGroupModule } from '../entity-group/entity-group.module.ts';
import { RestModule } from '../rest/rest.module.ts';

@Module({
  imports: [WorkspacesModule, RestModule, EntityGroupModule],
  providers: [SynchronizationService, YslService],
  exports: [SynchronizationService],
})
export class SynchronizationModule {}
