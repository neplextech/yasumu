import { Module } from '@yasumu/den';

import { ScriptRuntimeModule } from '../script-runtime/script-runtime.module.ts';
import { EmailResolver } from './email.resolver.ts';
import { EmailService } from './email.service.ts';

@Module({
  imports: [ScriptRuntimeModule],
  providers: [EmailService],
  resolvers: [EmailResolver],
  exports: [EmailService],
})
export class EmailModule {}
