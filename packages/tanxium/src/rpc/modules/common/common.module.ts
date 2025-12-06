import { Module, Global, EventBus } from '@yasumu/den';
import { TransactionalConnection } from './transactional-connection.service.ts';

@Global()
@Module({
  exports: [TransactionalConnection, EventBus],
  providers: [TransactionalConnection, EventBus],
})
export class CommonModule {}
