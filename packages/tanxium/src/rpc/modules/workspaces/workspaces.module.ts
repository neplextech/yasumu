import { Module } from '@yasumu/den';

import { EmailModule } from '../email/email.module.ts';
import { WorkspaceActivatorService } from './workspace-activator.service.ts';
import { WorkspacesResolver } from './workspaces.resolver.ts';
import { WorkspacesService } from './workspaces.service.ts';

@Module({
  imports: [EmailModule],
  providers: [WorkspacesService, WorkspaceActivatorService],
  resolvers: [WorkspacesResolver],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
