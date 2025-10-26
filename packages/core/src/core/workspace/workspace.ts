import { WorkspaceManager } from '../manager/manager.js';
import { RestModule } from '../modules/rest/rest.js';
import type { WorkspaceData } from './types.js';

/**
 * Represents a Yasumu workspace.
 */
export class Workspace {
  /**
   * The ID of the workspace.
   */
  public readonly id: string;
  /**
   * The REST module for the workspace.
   */
  public readonly rest = new RestModule(this);

  /**
   * Creates a new workspace.
   * @param manager The manager that owns this workspace.
   */
  public constructor(
    public readonly manager: WorkspaceManager,
    private data: WorkspaceData,
  ) {
    this.id = data.id;
  }

  /**
   * The name of the workspace.
   */
  public get name(): string {
    return this.data.name;
  }

  /**
   * The metadata of the workspace.
   */
  public get metadata(): Record<string, unknown> {
    return this.data.metadata;
  }

  /**
   * The date and time the workspace was created.
   */
  public get createdAt(): Date {
    return this.data.createdAt;
  }

  /**
   * The date and time the workspace was last updated.
   */
  public get updatedAt(): Date {
    return this.data.updatedAt;
  }

  /**
   * Converts the workspace to a JSON object.
   * @returns The JSON object.
   */
  public toJSON(): WorkspaceData {
    return this.data;
  }
}
