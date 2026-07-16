import type { WorkspaceData } from "@yasumu/common";
import { Injectable } from "@yasumu/den";
import { eq } from "drizzle-orm";

import { db } from "../../../database/index.ts";
import { workspaces } from "../../../database/schema.ts";
import {
  GuiWorkspaceReconciler,
  type WorkspaceReconciliationReport,
} from "./headless-reconciliation.service.ts";

@Injectable()
export class SynchronizationLoader {
  readonly #reconciler = new GuiWorkspaceReconciler(db);

  public async findWorkspace(id: string): Promise<WorkspaceData | null> {
    return db.select().from(workspaces).where(eq(workspaces.id, id)).get() ??
      null;
  }

  public loadAll(
    workspace: WorkspaceData,
  ): Promise<WorkspaceReconciliationReport> {
    return this.#reconciler.reconcile(workspace.id, workspace.path);
  }

  public createWorkspaceFromFs(workspacePath: string): Promise<WorkspaceData> {
    return this.#reconciler.importWorkspace(workspacePath);
  }
}
