import { Module } from '@yasumu/den';
import { SynchronizationService } from './synchronization.service.ts';
import { YslService } from './ysl.service.ts';
import { WorkspacesModule } from '../workspaces/workspaces.module.ts';
import { EntityGroupModule } from '../entity-group/entity-group.module.ts';
import { RestEntityModule } from '../rest-entity/rest-entity.module.ts';

@Module({
  imports: [WorkspacesModule, RestEntityModule, EntityGroupModule],
  providers: [SynchronizationService, YslService],
  exports: [SynchronizationService],
})
export class SynchronizationModule {}
