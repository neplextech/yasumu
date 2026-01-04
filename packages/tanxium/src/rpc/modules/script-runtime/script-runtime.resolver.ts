import { Mutation, Resolver } from '@yasumu/den';
import { ScriptRuntimeService } from './script-runtime.service.ts';

@Resolver('scriptRuntime')
export class ScriptRuntimeResolver {
  public constructor(
    private readonly scriptRuntimeService: ScriptRuntimeService,
  ) {}

  @Mutation()
  public terminateWorker() {
    this.scriptRuntimeService.terminateWorker();
  }
}
