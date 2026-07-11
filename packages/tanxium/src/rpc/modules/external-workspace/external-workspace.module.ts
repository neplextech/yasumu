import { Module } from '@yasumu/den';

import { ExternalWorkspaceResolver } from './external-workspace.resolver.ts';
import { ExternalWorkspaceService } from './external-workspace.service.ts';

@Module({
  imports: [],
  providers: [ExternalWorkspaceService],
  resolvers: [ExternalWorkspaceResolver],
  exports: [ExternalWorkspaceService],
})
export class ExternalWorkspaceModule {}
