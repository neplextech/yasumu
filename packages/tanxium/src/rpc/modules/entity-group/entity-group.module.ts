import { Module } from '@yasumu/den';
import { EntityGroupService } from './entity-group.service.ts';
import { RestModule } from '../rest/rest.module.ts';

@Module({
  imports: [RestModule],
  providers: [EntityGroupService],
  exports: [EntityGroupService],
})
export class EntityGroupModule {}
