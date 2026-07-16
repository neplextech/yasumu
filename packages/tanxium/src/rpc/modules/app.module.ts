import { Module } from "@yasumu/den";

import { CommonModule } from "./common/common.module.ts";
import { EmailModule } from "./email/email.module.ts";
import { EntityGroupModule } from "./entity-group/entity-group.module.ts";
import { EntityHistoryModule } from "./entity-history/entity-history.module.ts";
import { EnvironmentModule } from "./environment/environment.module.ts";
import { ExecutionModule } from "./execution/execution.module.ts";
import { ExternalWorkspaceModule } from "./external-workspace/external-workspace.module.ts";
import { GraphqlModule } from "./graphql/graphql.module.ts";
import { RestModule } from "./rest/rest.module.ts";
import { ScriptRuntimeModule } from "./script-runtime/script-runtime.module.ts";
import { SynchronizationModule } from "./synchronization/synchronization.module.ts";
import { WorkspacesModule } from "./workspaces/workspaces.module.ts";

@Module({
  imports: [
    CommonModule,
    WorkspacesModule,
    RestModule,
    GraphqlModule,
    EntityGroupModule,
    EntityHistoryModule,
    SynchronizationModule,
    ScriptRuntimeModule,
    EnvironmentModule,
    EmailModule,
    ExecutionModule,
    ExternalWorkspaceModule,
  ],
})
export class AppModule {}
