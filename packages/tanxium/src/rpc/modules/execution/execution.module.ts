import { Module } from '@yasumu/den';

import { ExecutionResolver } from './execution.resolver.ts';
import { ExecutionService } from './execution.service.ts';

@Module({
  providers: [ExecutionService],
  resolvers: [ExecutionResolver],
  exports: [ExecutionService],
})
export class ExecutionModule {}
