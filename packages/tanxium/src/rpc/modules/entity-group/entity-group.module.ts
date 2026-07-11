import { Module } from '@yasumu/den';

import { EntityGroupResolver } from './entity-group.resolver.ts';
import { EntityGroupService } from './entity-group.service.ts';

@Module({
  imports: [],
  providers: [EntityGroupService],
  exports: [EntityGroupService],
  resolvers: [EntityGroupResolver],
})
export class EntityGroupModule {}
