import { Module } from '@yasumu/den';

import { ScriptRuntimeResolver } from './script-runtime.resolver.ts';
import { ScriptRuntimeService } from './script-runtime.service.ts';

@Module({
  resolvers: [ScriptRuntimeResolver],
  providers: [ScriptRuntimeService],
  exports: [ScriptRuntimeService],
})
export class ScriptRuntimeModule {}
