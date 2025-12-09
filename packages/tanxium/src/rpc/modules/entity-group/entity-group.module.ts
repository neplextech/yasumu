import { Module } from '@yasumu/den';
import { EntityGroupService } from './entity-group.service.ts';
import { RestModule } from '../rest/rest.module.ts';
import { EntityGroupResolver } from './entity-group.resolver.ts';

@Module({
  imports: [RestModule],
  providers: [EntityGroupService],
  exports: [EntityGroupService],
  resolvers: [EntityGroupResolver],
})
export class EntityGroupModule {}
