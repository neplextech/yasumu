import { Module } from '@yasumu/den';

import { EntityGroupModule } from '../entity-group/entity-group.module.ts';
import { ScriptRuntimeModule } from '../script-runtime/script-runtime.module.ts';
import { RestResolver } from './rest.resolver.ts';
import { RestService } from './rest.service.ts';

@Module({
  imports: [EntityGroupModule, ScriptRuntimeModule],
  providers: [RestService],
  resolvers: [RestResolver],
  exports: [RestService],
})
export class RestModule {}
