import { Module } from '@yasumu/den';
import { WorkspacesService } from './workspaces.service.ts';
import { WorkspacesResolver } from './workspaces.resolver.ts';

@Module({
  providers: [WorkspacesService],
  resolvers: [WorkspacesResolver],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
