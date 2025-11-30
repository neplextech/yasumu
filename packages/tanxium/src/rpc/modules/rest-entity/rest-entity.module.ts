import { Module } from '@yasumu/den';
import { RestEntityService } from './rest-entity.service.ts';
import { RestEntityResolver } from './rest-entity.resolver.ts';
import { RestModule } from '../rest/rest.module.ts';

@Module({
  imports: [RestModule],
  providers: [RestEntityService],
  resolvers: [RestEntityResolver],
  exports: [RestEntityService],
})
export class RestEntityModule {}
