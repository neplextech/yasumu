import type { WorkspaceService } from '@/services/workspace.service.js';

/**
 * Represents a workspace in the Yasumu application.
 */
export class WorkspaceEntity {
  /**
   * Creates a new workspace entity.
   * @param workspaceService The workspace service.
   */
  public constructor(public readonly workspaceService: WorkspaceService) {}
}
