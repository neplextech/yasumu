import { Module } from '@yasumu/den';
import { FileSynchronizationService } from './file-synchronization.service.ts';
import { YslService } from './ysl.service.ts';

@Module({
  providers: [FileSynchronizationService, YslService],
  exports: [FileSynchronizationService],
})
export class FileSynchronizationModule {}
