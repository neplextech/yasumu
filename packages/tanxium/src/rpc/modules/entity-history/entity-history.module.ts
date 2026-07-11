import { Module } from '@yasumu/den';

import { EntityHistoryResolver } from './entity-history.resolver.ts';
import { EntityHistoryService } from './entity-history.service.ts';

@Module({
  imports: [],
  providers: [EntityHistoryService],
  exports: [EntityHistoryService],
  resolvers: [EntityHistoryResolver],
})
export class EntityHistoryModule {}
