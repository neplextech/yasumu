import type { EnvironmentManager } from '../../manager/environment-manager.js';
import type { Workspace } from '../workspace.js';
import type { EnvironmentData, EnvironmentUpdateOptions } from '@yasumu/common';
import { EnvironmentVariable } from './environment-variable.js';

export class Environment {
  /**
   * The variables manager of this environment.
   */
  public readonly variables: EnvironmentVariable;
  /**
   * The secrets manager of this environment.
   */
  public readonly secrets: EnvironmentVariable;

  /**
   * Creates a new environment.
   * @param manager The manager that owns this environment.
   * @param data The data of the environment.
   */
  public constructor(
    public readonly manager: EnvironmentManager,
    private data: EnvironmentData,
  ) {
    this.variables = new EnvironmentVariable(async () => {
      await this.update({
        variables: this.variables.toJSON(),
      });
    }, this.data.variables);

    this.secrets = new EnvironmentVariable(async () => {
      await this.update({
        secrets: this.secrets.toJSON(),
      });
    }, this.data.secrets);
  }

  /**
   * The workspace that owns this environment.
   */
  public get workspace(): Workspace {
    return this.manager.workspace;
  }

  /**
   * The id of this environment.
   */
  public get id(): string {
    return this.data.id;
  }

  /**
   * The name of this environment.
   */
  public get name(): string {
    return this.data.name;
  }

  /**
   * Set this environment as the active environment for the workspace.
   */
  public async setActive(): Promise<void> {
    await this.manager.setActiveEnvironment(this.id);
  }

  /**
   * Updates this environment.
   * @param data The data to update the environment with.
   * @returns The updated environment.
   */
  public async update(
    data: Partial<EnvironmentUpdateOptions>,
    options: { noEmit?: boolean } = {},
  ): Promise<Environment> {
    const result = await this.manager.update(this.id, data, options);
    // patch this instance to avoid potentially stale data
    Object.assign(this.data, result);
    return result;
  }

  private getInterpolationConfig(
    target: string,
  ): ['variable' | 'secret' | null, string] {
    if (!target) return [null, ''];
    if (target.startsWith('variables.')) return ['variable', target.slice(10)];
    if (target.startsWith('secrets.')) return ['secret', target.slice(8)];

    return [null, target];
  }

  /**
   * Interpolates environment variables and secrets in a string.
   * Supports both direct variable names and prefixed syntax:
   * - {{variableName}} - looks up in variables first, then secrets
   * - {{variables.variableName}} - looks up only in variables
   * - {{secrets.secretName}} - looks up only in secrets
   *
   * @param str The string to interpolate
   * @returns The interpolated string with variables replaced by their values
   */
  public interpolate(str: string): string {
    if (!str || typeof str !== 'string') return str;

    const { variables, secrets } = this;

    return str.replace(/{{(.*?)}}/g, (match, p1: string) => {
      const key = p1.trim();
      if (!key) return match;

      const [type, variableKey] = this.getInterpolationConfig(key);

      // Handle prefixed syntax (variables.* or secrets.*)
      if (type) {
        const store = type === 'variable' ? variables : secrets;
        const value = store.get(variableKey);
        return value?.value ?? match;
      }

      // Handle direct variable lookup (check variables first, then secrets)
      const variable = variables.get(key);
      if (variable?.value !== undefined) return variable.value;

      const secret = secrets.get(key);
      if (secret?.value !== undefined) return secret.value;

      return match;
    });
  }

  /**
   * Converts this environment to a JSON object.
   * @returns The JSON object.
   */
  public toJSON(): EnvironmentData {
    return this.data;
  }
}
