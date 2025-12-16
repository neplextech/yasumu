import type { Workspace } from '@/core/workspace/workspace.js';

export interface YasumuEventHandlerInterface {
  /**
   * Called when a workspace is activated.
   * @param workspace - The workspace that was activated.
   */
  onWorkspaceActivated: (workspace: Workspace) => unknown;
  /**
   * Called when a workspace is deactivated.
   * @param workspace - The workspace that was deactivated.
   */
  onWorkspaceDeactivated: (workspace: Workspace) => unknown;
  /**
   * Called when a rest entity is updated.
   * @param entity - The rest entity that was updated.
   */
  onRestEntityUpdate: (workspace: Workspace) => unknown;
}
