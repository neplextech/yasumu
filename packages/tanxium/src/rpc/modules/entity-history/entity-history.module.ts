import { Module } from '@yasumu/den';
import { EntityHistoryService } from './entity-history.service.ts';
import { EntityHistoryResolver } from './entity-history.resolver.ts';

@Module({
  imports: [],
  providers: [EntityHistoryService],
  exports: [EntityHistoryService],
  resolvers: [EntityHistoryResolver],
})
export class EntityHistoryModule {}
