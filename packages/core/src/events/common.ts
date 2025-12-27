import type { Environment } from '@/core/workspace/environment/environment.js';
import type { Workspace } from '@/core/workspace/workspace.js';
import type { EmailData } from '@yasumu/common';

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
  /**
   * Called when an environment is updated.
   * @param environment - The environment that was updated.
   */
  onEnvironmentUpdated: (environment: Environment) => unknown;
  /**
   * Called when an environment is activated.
   * @param workspace - The workspace that the environment was activated for.
   */
  onEnvironmentActivated: (workspace: Workspace) => unknown;
  /**
   * Called when an environment is deleted.
   * @param workspace - The workspace that the environment was deleted from.
   */
  onEnvironmentDeleted: (workspace: Workspace) => unknown;
  /**
   * Called when an environment is created.
   * @param environment - The environment that was created.
   */
  onEnvironmentCreated: (environment: Environment) => unknown;
  /**
   * Called when a new email is received.
   * @param workspaceId - The workspace ID that the email was received in.
   * @param email - The email that was received.
   */
  onNewEmail: (workspaceId: string, email: EmailData) => unknown;
}
