import { Module, Global } from '@yasumu/den';
import { TransactionalConnection } from './transactional-connection.service.ts';

@Global()
@Module({
  exports: [TransactionalConnection],
  providers: [TransactionalConnection],
})
export class CommonModule {}
