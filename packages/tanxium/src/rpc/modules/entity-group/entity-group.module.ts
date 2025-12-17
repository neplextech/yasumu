import { Module } from '@yasumu/den';
import { EntityGroupService } from './entity-group.service.ts';
import { EntityGroupResolver } from './entity-group.resolver.ts';

@Module({
  imports: [],
  providers: [EntityGroupService],
  exports: [EntityGroupService],
  resolvers: [EntityGroupResolver],
})
export class EntityGroupModule {}
