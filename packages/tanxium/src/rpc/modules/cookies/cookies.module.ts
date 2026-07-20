import { Module } from '@yasumu/den';

import { ExecutionModule } from '../execution/execution.module.ts';
import { CookiesResolver } from './cookies.resolver.ts';
import { CookiesService } from './cookies.service.ts';

@Module({
  imports: [ExecutionModule],
  providers: [CookiesService],
  resolvers: [CookiesResolver],
  exports: [CookiesService],
})
export class CookiesModule {}
