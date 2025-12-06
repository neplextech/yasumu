import { Module } from '@yasumu/den';
import { RestEntityService } from './rest-entity.service.ts';
import { RestEntityResolver } from './rest-entity.resolver.ts';
import { RestModule } from '../rest/rest.module.ts';
import { EntityGroupModule } from '../entity-group/entity-group.module.ts';

@Module({
  imports: [RestModule, EntityGroupModule],
  providers: [RestEntityService],
  resolvers: [RestEntityResolver],
  exports: [RestEntityService],
})
export class RestEntityModule {}
