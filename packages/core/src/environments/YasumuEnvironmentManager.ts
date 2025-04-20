import { YasumuWorkspaceEvents } from '../events/common.js';
import type { YasumuWorkspace } from '../YasumuWorkspace.js';
import {
  YasumuEnvironment,
  type CreateEnvironmentOptions,
  type YasumuEnvironmentEntityData,
} from './YasumuEnvironment.js';

export interface YasumuWorkspaceEnvironmentData {
  selectedEnvironment: string;
  environments: YasumuEnvironmentEntityData;
}

export class YasumuEnvironmentManager {
  /**
   * The cache of environments.
   */
  #environments = new Map<string, YasumuEnvironment>();

  /**
   * Creates a new environment manager.
   * @param workspace The workspace this environment manager is associated with.
   */
  public constructor(public readonly workspace: YasumuWorkspace) {}

  public async loadEnvironments() {
    const { environments } = this.workspace.getMetadata().getRawData()
      .blocks.Environment;

    for (const id in environments) {
      const env = new YasumuEnvironment(this, environments[id]);
      this.#environments.set(id, env);
      await env.save();
    }
  }

  /**
   * Get all environments.
   */
  public getEnvironments(): YasumuEnvironment[] {
    return Array.from(this.#environments.values());
  }

  /**
   * Get currently selected environment.
   */
  public getSelectedEnvironment(): YasumuEnvironment | null {
    const selectedId = this.workspace.getMetadata().getRawData().blocks
      .Environment.selectedEnvironment;
    return this.getEnvironment(selectedId);
  }

  /**
   * Select an environment.
   * @param id The environment id.
   */
  public async selectEnvironment(id: string): Promise<void> {
    const workspaceMetadata = this.workspace.getMetadata();
    const metadata = workspaceMetadata.getRawData();

    if (id !== '') {
      const env = this.getEnvironment(id);

      if (!env) {
        throw new Error(`Environment with id "${id}" does not exist.`);
      }

      metadata.blocks.Environment.selectedEnvironment = id;

      this.workspace.events.emit(
        YasumuWorkspaceEvents.EnvironmentSelected,
        env,
      );
    } else {
      metadata.blocks.Environment.selectedEnvironment = '';

      this.workspace.events.emit(
        YasumuWorkspaceEvents.EnvironmentSelectionRemoved,
      );
    }

    await workspaceMetadata.save();
  }

  /**
   * Gets an environment by its id.
   * @param id The environment id.
   */
  public getEnvironment(id: string): YasumuEnvironment | null {
    return this.#environments.get(id) ?? null;
  }

  /**
   * Creates a new environment.
   * @param options The options to create the environment with.
   */
  public async createEnvironment(
    options: CreateEnvironmentOptions,
  ): Promise<YasumuEnvironment> {
    if (options.id && this.#environments.has(options.id)) {
      throw new Error(
        `An environment with the id "${options.id}" already exists.`,
      );
    }

    const env = new YasumuEnvironment(this, {
      name: options.name,
      id: options.id,
    });

    await env.save();

    this.#environments.set(env.id, env);

    if (!this.getSelectedEnvironment()) {
      await this.selectEnvironment(env.id);
    }

    this.workspace.events.emit(YasumuWorkspaceEvents.EnvironmentCreated, env);

    return env;
  }

  /**
   * Deletes an environment.
   * @param id The environment id.
   */
  public async deleteEnvironment(id: string): Promise<void> {
    const env = this.#environments.get(id);

    if (!env) {
      throw new Error(`Environment with id "${id}" does not exist.`);
    }

    this.#environments.delete(id);

    const workspaceMetadata = this.workspace.getMetadata();
    const metadata = workspaceMetadata.getRawData();
    delete metadata.blocks.Environment.environments[id];

    if (metadata.blocks.Environment.selectedEnvironment === id) {
      metadata.blocks.Environment.selectedEnvironment = '';
    }

    await workspaceMetadata.save();

    this.workspace.events.emit(YasumuWorkspaceEvents.EnvironmentDeleted, env);
  }
}
