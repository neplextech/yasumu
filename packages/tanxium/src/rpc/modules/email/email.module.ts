import { Module } from '@yasumu/den';
import { EmailService } from './email.service.ts';
import { EmailResolver } from './email.resolver.ts';

@Module({
  providers: [EmailService],
  resolvers: [EmailResolver],
  exports: [EmailService],
})
export class EmailModule {}
