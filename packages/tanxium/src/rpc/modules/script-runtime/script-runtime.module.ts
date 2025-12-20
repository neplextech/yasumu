import { Module } from '@yasumu/den';
import { ScriptRuntimeService } from './script-runtime.service.ts';
import { ScriptRuntimeResolver } from './script-runtime.resolver.ts';

@Module({
  resolvers: [ScriptRuntimeResolver],
  providers: [ScriptRuntimeService],
  exports: [ScriptRuntimeService],
})
export class ScriptRuntimeModule {}
