import { Module } from '@yasumu/den';
import { WorkspacesModule } from './workspaces/workspaces.module.ts';
import { CommonModule } from './common/common.module.ts';
import { RestModule } from './rest/rest.module.ts';
import { EntityGroupModule } from './entity-group/entity-group.module.ts';
import { SynchronizationModule } from './synchronization/synchronization.module.ts';
import { ScriptRuntimeModule } from './script-runtime/script-runtime.module.ts';
import { EnvironmentModule } from './environment/environment.module.ts';
import { EmailModule } from './email/email.module.ts';

@Module({
  imports: [
    CommonModule,
    WorkspacesModule,
    RestModule,
    EntityGroupModule,
    SynchronizationModule,
    ScriptRuntimeModule,
    EnvironmentModule,
    EmailModule,
  ],
})
export class AppModule {}
