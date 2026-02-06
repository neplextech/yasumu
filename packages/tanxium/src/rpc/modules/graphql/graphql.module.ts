import { Module } from '@yasumu/den';
import { GraphqlService } from './graphql.service.ts';
import { GraphqlResolver } from './graphql.resolver.ts';
import { EntityGroupModule } from '../entity-group/entity-group.module.ts';
import { ScriptRuntimeModule } from '../script-runtime/script-runtime.module.ts';

@Module({
  imports: [EntityGroupModule, ScriptRuntimeModule],
  providers: [GraphqlService],
  resolvers: [GraphqlResolver],
  exports: [GraphqlService],
})
export class GraphqlModule {}
