import { Module } from '@yasumu/den';

import { EntityGroupModule } from '../entity-group/entity-group.module.ts';
import { ScriptRuntimeModule } from '../script-runtime/script-runtime.module.ts';
import { GraphqlResolver } from './graphql.resolver.ts';
import { GraphqlService } from './graphql.service.ts';

@Module({
  imports: [EntityGroupModule, ScriptRuntimeModule],
  providers: [GraphqlService],
  resolvers: [GraphqlResolver],
  exports: [GraphqlService],
})
export class GraphqlModule {}
