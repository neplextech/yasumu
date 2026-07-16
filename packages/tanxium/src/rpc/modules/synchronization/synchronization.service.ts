import { WorkspaceData } from "@yasumu/common";
import { EventBus, Injectable, OnModuleInit } from "@yasumu/den";
import type { WorkspaceSynchronizationResult } from "@yasumu/rpc";

import { KeyedMutex } from "@/common/mutex.ts";

import { isDefaultWorkspacePath } from "../../common/constants.ts";
import { WorkspaceDiscoveryEvent } from "../common/events/workspace-discovery.event.ts";
import { WorkspaceEvent } from "../common/events/workspace.event.ts";
import { WorkspaceReconciliationConflictError } from "./headless-reconciliation.service.ts";
import { SynchronizationLoader } from "./synchronization-loader.service.ts";
import { SynchronizationPusher } from "./synchronization-pusher.service.ts";

@Injectable()
export class SynchronizationService implements OnModuleInit {
  private readonly workspaceMutex = new KeyedMutex();

  public constructor(
    private readonly loader: SynchronizationLoader,
    private readonly pusher: SynchronizationPusher,
    private readonly eventBus: EventBus,
  ) {}

  public onModuleInit() {
    this.eventBus
      .ofType(WorkspaceEvent)
      .filter((event) => event.type === "activated")
      .subscribe(async (event) => {
        await this.loadFromFileSystem(event.workspaceId);
      });

    this.eventBus.ofType(WorkspaceDiscoveryEvent).subscribe(async (event) => {
      await this.discoverWorkspace(event.workspacePath, event.onComplete);
    });
  }

  public async loadFromFileSystem(workspaceId: string): Promise<void> {
    return this.workspaceMutex.runExclusive(workspaceId, async () => {
      const workspace = await this.loader.findWorkspace(workspaceId);

      if (!workspace) return;
      if (isDefaultWorkspacePath(workspace.path)) return;

      const report = await this.loader.loadAll(workspace);
      if (report.conflicts.length > 0) {
        throw new WorkspaceReconciliationConflictError(report);
      }
    });
  }

  public async synchronizeWorkspace(
    workspaceId: string,
  ): Promise<WorkspaceSynchronizationResult> {
    return this.workspaceMutex.runExclusive(workspaceId, async () => {
      const workspace = await this.loader.findWorkspace(workspaceId);

      if (!workspace) {
        return emptySynchronizationResult(workspaceId, "workspace-not-found");
      }
      if (isDefaultWorkspacePath(workspace.path)) {
        return emptySynchronizationResult(workspaceId, "default-workspace");
      }

      const report = await this.loader.loadAll(workspace);
      if (report.conflicts.length > 0) {
        return {
          ...report,
          pushed: false,
          skippedReason: "conflict",
        };
      }

      const refreshedWorkspace =
        (await this.loader.findWorkspace(workspaceId)) ?? workspace;
      await this.pusher.pushAll(refreshedWorkspace);
      return { ...report, pushed: true };
    });
  }

  private async discoverWorkspace(
    workspacePath: string,
    onComplete: (workspace: WorkspaceData | null) => Promise<void>,
  ): Promise<void> {
    return this.workspaceMutex.runExclusive(
      `discover:${workspacePath}`,
      async () => {
        const workspace = await this.loader.createWorkspaceFromFs(
          workspacePath,
        );
        return onComplete(workspace);
      },
    );
  }
}

function emptySynchronizationResult(
  workspaceId: string,
  skippedReason: "workspace-not-found" | "default-workspace",
): WorkspaceSynchronizationResult {
  return {
    workspaceId,
    entries: [],
    conflicts: [],
    pushed: false,
    skippedReason,
  };
}
