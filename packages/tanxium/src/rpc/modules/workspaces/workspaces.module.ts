import { Module } from '@yasumu/den';
import { WorkspacesService } from './workspaces.service.ts';
import { WorkspacesResolver } from './workspaces.resolver.ts';
import { WorkspaceActivatorService } from './workspace-activator.service.ts';

@Module({
  providers: [WorkspacesService, WorkspaceActivatorService],
  resolvers: [WorkspacesResolver],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
