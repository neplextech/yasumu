import type { Yasumu } from '@/yasumu.js';
import { Workspace } from '../workspace/workspace.js';
import type {
  WorkspaceCreateOptions,
  WorkspaceOpenOptions,
} from '@yasumu/common';
import type { PartialWorkspace, WorkspaceData } from '@yasumu/common';

/**
 * The manager for workspaces.
 */
export class WorkspaceManager {
  /**
   * Represents the currently active workspace id.
   */
  private activeWorkspaceId: string | null = null;
  /**
   * A map of all loaded workspaces in this manager.
   */
  public readonly workspaces: Map<string, Workspace> = new Map();

  /**
   * Creates a new workspace manager.
   * @param yasumu The Yasumu instance that owns this manager.
   */
  public constructor(public readonly yasumu: Yasumu) {}

  /**
   * Gets the currently active workspace.
   * @param throwIfNotFound Whether to throw an error if the workspace is not found. Defaults to `false`.
   * @returns The active workspace or null if no workspace is active.
   */
  public getActiveWorkspace(): Workspace | null;
  public getActiveWorkspace(throwIfNotFound: true): Workspace;
  public getActiveWorkspace(throwIfNotFound: false): Workspace | null;
  public getActiveWorkspace(
    throwIfNotFound: boolean = false,
  ): Workspace | null {
    const workspace = this.activeWorkspaceId
      ? (this.workspaces.get(this.activeWorkspaceId) ?? null)
      : null;

    if (throwIfNotFound && !workspace) {
      throw new Error('Workspace not found');
    }

    return workspace;
  }

  /**
   * Fetches the active workspace from the RPC layer. This may or may not work depending on the platform.
   */
  public async fetchActiveWorkspace(): Promise<Workspace | null> {
    const id = await this.yasumu.rpc.workspaces.active.$query({
      parameters: [],
    });

    if (!id) return null;

    if (id === this.activeWorkspaceId) return this.getActiveWorkspace();

    return this.open({ id });
  }

  /**
   * Opens an existing workspace. Throws an error if the workspace does not exist.
   * @param options The options for opening the workspace.
   * @returns The opened workspace.
   */
  public async open(options: WorkspaceOpenOptions): Promise<Workspace> {
    const data = await this.yasumu.rpc.workspaces.get.$query({
      parameters: [options.id],
    });
    return this.$activate(new Workspace(this, data));
  }

  /**
   * Creates a new workspace.
   * @param options The options for creating the workspace.
   * @returns The created workspace.
   */
  public async create(options: WorkspaceCreateOptions): Promise<Workspace> {
    const data = await this.yasumu.rpc.workspaces.create.$mutate({
      parameters: [options],
    });
    return this.$activate(new Workspace(this, data));
  }

  public async close(workspace: Workspace): Promise<void> {
    return this.$deactivate(workspace);
  }

  /**
   * Deletes the given workspace by id. Throws an error if the workspace does not exist.
   * @param id The ID of the workspace to delete.
   */
  public async delete(id: string): Promise<void> {
    if (id === this.activeWorkspaceId) {
      this.activeWorkspaceId = null;
    }
    this.workspaces.delete(id);
    // TODO: invoke the lifecycle hooks for the workspace deactivation
    return;
  }

  /**
   * Lists all workspaces.
   * @returns The list of workspaces.
   */
  public async list({ take }: { take?: number } = {}): Promise<Workspace[]> {
    const data = await this.yasumu.rpc.workspaces.list.$query({
      parameters: [{ take }],
    });
    return data.map((data) => new Workspace(this, data));
  }

  /**
   * Activates the given workspace.
   * @param workspace The workspace to activate.
   * @returns The activated workspace.
   */
  private async $activate(workspace: Workspace): Promise<Workspace> {
    this.workspaces.set(workspace.id, workspace);
    await this.yasumu.rpc.workspaces.activate.$mutate({
      parameters: [workspace.id],
    });
    if (this.activeWorkspaceId === workspace.id) {
      return workspace;
    }

    this.activeWorkspaceId = workspace.id;
    this.yasumu.events.emit('onWorkspaceActivated', workspace);

    // TODO: invoke the lifecycle hooks for the workspace activation
    return workspace;
  }

  /**
   * Deactivates the given workspace.
   * @param workspace The workspace to deactivate.
   */
  private async $deactivate(workspace: Workspace): Promise<void> {
    this.workspaces.delete(workspace.id);
    await this.yasumu.rpc.workspaces.deactivate.$mutate({
      parameters: [workspace.id],
    });
    if (this.activeWorkspaceId === workspace.id) {
      this.activeWorkspaceId = null;
    }

    this.yasumu.events.emit('onWorkspaceDeactivated', workspace);
    // TODO: invoke the lifecycle hooks for the workspace deactivation
  }
}
