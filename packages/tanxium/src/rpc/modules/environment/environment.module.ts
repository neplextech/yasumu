import { Module } from '@yasumu/den';
import { EnvironmentsService } from './environment.service.ts';
import { EnvironmentResolver } from './environment.resolver.ts';
import { WorkspacesModule } from '../workspaces/workspaces.module.ts';

@Module({
  imports: [WorkspacesModule],
  providers: [EnvironmentsService],
  resolvers: [EnvironmentResolver],
  exports: [EnvironmentsService],
})
export class EnvironmentModule {}
