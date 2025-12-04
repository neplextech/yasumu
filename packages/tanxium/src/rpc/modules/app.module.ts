import { Module } from '@yasumu/den';
import { WorkspacesModule } from './workspaces/workspaces.module.ts';
import { CommonModule } from './common/common.module.ts';
import { RestModule } from './rest/rest.module.ts';
import { RestEntityModule } from './rest-entity/rest-entity.module.ts';
import { EntityGroupModule } from './entity-group/entity-group.module.ts';

@Module({
  imports: [
    CommonModule,
    WorkspacesModule,
    RestModule,
    RestEntityModule,
    EntityGroupModule,
  ],
})
export class AppModule {}
