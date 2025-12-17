import { Module } from '@yasumu/den';
import { RestService } from './rest.service.ts';
import { RestResolver } from './rest.resolver.ts';
import { EntityGroupModule } from '../entity-group/entity-group.module.ts';

@Module({
  imports: [EntityGroupModule],
  providers: [RestService],
  resolvers: [RestResolver],
  exports: [RestService],
})
export class RestModule {}
