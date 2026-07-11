import { Module, Global, EventBus } from '@yasumu/den';

import { TanxiumService } from './tanxium.service.ts';
import { TransactionalConnection } from './transactional-connection.service.ts';

@Global()
@Module({
  exports: [TransactionalConnection, EventBus, TanxiumService],
  providers: [TransactionalConnection, EventBus, TanxiumService],
})
export class CommonModule {}
