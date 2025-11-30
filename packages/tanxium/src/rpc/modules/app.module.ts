import { Module } from '@yasumu/den';
import { WorkspacesModule } from './workspaces/workspaces.module.ts';
import { CommonModule } from './common/common.module.ts';
import { RestModule } from './rest/rest.module.ts';
import { RestEntityModule } from './rest-entity/rest-entity.module.ts';

@Module({
  imports: [CommonModule, WorkspacesModule, RestModule, RestEntityModule],
})
export class AppModule {}
