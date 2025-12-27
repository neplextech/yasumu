import { Environment } from '../workspace/environment/environment.js';
import type { Workspace } from '../workspace/workspace.js';
import type {
  EnvironmentCreateOptions,
  EnvironmentUpdateOptions,
} from '@yasumu/common';

export class EnvironmentManager {
  /**
   * Creates a new environment manager.
   * @param workspace The workspace that owns this manager.
   */
  public constructor(public readonly workspace: Workspace) {}

  /**
   * Gets the currently active environment for the workspace.
   * @returns The active environment or null if no environment is active.
   */
  public async getActiveEnvironment(): Promise<Environment | null> {
    const env =
      await this.workspace.manager.yasumu.rpc.environments.getActive.$query({
        parameters: [],
      });

    return env ? new Environment(this, env) : null;
  }

  /**
   * Sets the currently active environment for the workspace.
   * @param id The ID of the environment to set as active.
   */
  public async setActiveEnvironment(id: string): Promise<void> {
    await this.workspace.manager.yasumu.rpc.environments.setActive.$mutate({
      parameters: [id],
    });
    this.workspace.manager.yasumu.events.emit(
      'onEnvironmentActivated',
      this.workspace,
    );
  }

  /**
   * Lists all environments for the workspace.
   * @returns The list of environments.
   */
  public async list(): Promise<Environment[]> {
    const envs =
      await this.workspace.manager.yasumu.rpc.environments.list.$query({
        parameters: [],
      });

    return envs.map((env) => new Environment(this, env));
  }

  /**
   * Creates a new environment for the workspace.
   * @param name The name of the environment.
   * @returns The created environment.
   */
  public async create(data: EnvironmentCreateOptions): Promise<Environment> {
    const env =
      await this.workspace.manager.yasumu.rpc.environments.create.$mutate({
        parameters: [data],
      });

    const newEnv = new Environment(this, env);
    this.workspace.manager.yasumu.events.emit('onEnvironmentCreated', newEnv);
    return newEnv;
  }

  /**
   * Deletes an environment for the workspace.
   * @param id The ID of the environment to delete.
   */
  public async delete(id: string): Promise<void> {
    await this.workspace.manager.yasumu.rpc.environments.delete.$mutate({
      parameters: [id],
    });

    this.workspace.manager.yasumu.events.emit(
      'onEnvironmentDeleted',
      this.workspace,
    );
  }

  /**
   * Gets an environment for the workspace.
   * @param id The ID of the environment to get.
   * @returns The environment.
   */
  public async get(id: string): Promise<Environment | null> {
    const env = await this.workspace.manager.yasumu.rpc.environments.get.$query(
      {
        parameters: [id],
      },
    );

    if (!env) {
      return null;
    }

    return new Environment(this, env);
  }

  /**
   * Updates an environment for the workspace.
   * @param id The ID of the environment to update.
   * @param data The data to update the environment with.
   * @returns The updated environment.
   */
  public async update(
    id: string,
    data: Partial<EnvironmentUpdateOptions>,
    options: { noEmit?: boolean } = {},
  ): Promise<Environment> {
    const env =
      await this.workspace.manager.yasumu.rpc.environments.update.$mutate({
        parameters: [id, data],
      });
    const newEnv = new Environment(this, env);

    if (!options.noEmit) {
      this.workspace.manager.yasumu.events.emit('onEnvironmentUpdated', newEnv);
    }

    return newEnv;
  }
}
