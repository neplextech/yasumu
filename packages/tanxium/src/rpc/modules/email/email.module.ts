import { Module } from '@yasumu/den';

import { ExecutionModule } from '../execution/execution.module.ts';
import { EmailResolver } from './email.resolver.ts';
import { EmailService } from './email.service.ts';

@Module({
  imports: [ExecutionModule],
  providers: [EmailService],
  resolvers: [EmailResolver],
  exports: [EmailService],
})
export class EmailModule {}
