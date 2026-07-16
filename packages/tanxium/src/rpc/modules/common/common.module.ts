import { Module, Global, EventBus } from '@yasumu/den';

import { TanxiumService } from './tanxium.service.ts';
import { HeadlessCrudService } from './headless-crud.service.ts';
import { TransactionalConnection } from './transactional-connection.service.ts';

@Global()
@Module({
  exports: [TransactionalConnection, EventBus, TanxiumService, HeadlessCrudService],
  providers: [TransactionalConnection, EventBus, TanxiumService, HeadlessCrudService],
})
export class CommonModule {}
