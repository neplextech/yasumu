import { Module } from '@yasumu/den';
import { RestService } from './rest.service.ts';

@Module({
  providers: [RestService],
  exports: [RestService],
})
export class RestModule {}
