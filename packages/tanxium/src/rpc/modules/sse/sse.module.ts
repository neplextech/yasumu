import { Module } from '@yasumu/den';

import { EntityGroupModule } from '../entity-group/entity-group.module.ts';
import { SseResolver } from './sse.resolver.ts';
import { SseService } from './sse.service.ts';

@Module({ imports: [EntityGroupModule], providers: [SseService], resolvers: [SseResolver], exports: [SseService] })
export class SseModule {}
