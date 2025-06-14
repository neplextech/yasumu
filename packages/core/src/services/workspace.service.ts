import { WorkspaceEntity } from '@/entities/workspace.entity.js';
import type { Yasumu } from '@/yasumu.js';
import { RestService } from './rest.service.js';

/**
 * The workspace service for the Yasumu application.
 */
export class WorkspaceService {
  /**
   * The currently active workspace.
   */
  public current: WorkspaceEntity | null = null;

  /**
   * The rest module service for this workspace.
   */
  public rest = new RestService(this);

  /**
   * Creates a new workspace service.
   * @param yasumu The Yasumu instance.
   */
  public constructor(private readonly yasumu: Yasumu) {}

  /**
   * Gets the currently active workspace or throws an error if no workspace is currently open.
   * @returns The currently active workspace.
   * @throws An error if no workspace is currently open.
   */
  public getCurrentWorkspaceOrThrow(): WorkspaceEntity {
    if (!this.current) {
      throw new Error('No workspace is currently open.');
    }

    return this.current;
  }

  /**
   * Opens a workspace by its ID.
   * @param workspaceId The ID of the workspace to open.
   * @returns The opened workspace.
   */
  public async open(workspaceId: string): Promise<WorkspaceEntity> {
    // TODO
    return new WorkspaceEntity(this);
  }

  /**
   * Creates a new workspace.
   * @param name The name of the workspace to create.
   * @returns The created workspace.
   */
  public async create(name: string): Promise<WorkspaceEntity> {
    // TODO
    return new WorkspaceEntity(this);
  }

  /**
   * Closes the currently active workspace.
   */
  public async close(): Promise<void> {
    // TODO
  }
}
