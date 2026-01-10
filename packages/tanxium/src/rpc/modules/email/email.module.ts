import { Module } from '@yasumu/den';
import { EmailService } from './email.service.ts';
import { EmailResolver } from './email.resolver.ts';
import { ScriptRuntimeModule } from '../script-runtime/script-runtime.module.ts';

@Module({
  imports: [ScriptRuntimeModule],
  providers: [EmailService],
  resolvers: [EmailResolver],
  exports: [EmailService],
})
export class EmailModule {}
