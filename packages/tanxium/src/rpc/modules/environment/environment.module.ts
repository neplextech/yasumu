import { Module } from '@yasumu/den';

import { WorkspacesModule } from '../workspaces/workspaces.module.ts';
import { EnvironmentResolver } from './environment.resolver.ts';
import { EnvironmentsService } from './environment.service.ts';

@Module({
  imports: [WorkspacesModule],
  providers: [EnvironmentsService],
  resolvers: [EnvironmentResolver],
  exports: [EnvironmentsService],
})
export class EnvironmentModule {}
