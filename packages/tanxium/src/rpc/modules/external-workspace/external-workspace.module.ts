import { Module } from '@yasumu/den';
import { ExternalWorkspaceService } from './external-workspace.service.ts';
import { ExternalWorkspaceResolver } from './external-workspace.resolver.ts';

@Module({
  imports: [],
  providers: [ExternalWorkspaceService],
  resolvers: [ExternalWorkspaceResolver],
  exports: [ExternalWorkspaceService],
})
export class ExternalWorkspaceModule {}
