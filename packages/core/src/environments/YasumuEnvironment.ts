import { deepMerge, generateId } from '@/common/utils.js';
import type { YasumuEnvironmentManager } from './YasumuEnvironmentManager.js';
import { YasumuWorkspaceEvents } from '../events/common.js';

export interface CreateEnvironmentOptions {
  /**
   * Environment id for this environment.
   */
  id?: string;
  /**
   * The name of the environment.
   */
  name?: string;
}

export interface YasumuEnvironmentEntity {
  /**
   * The entity name
   */
  name: string;
  /**
   * The entity id
   */
  id: string;
  /**
   * The entity creation date
   */
  createdAt: number;
  /**
   * The entity variables
   */
  variables: YasumuEnvironmentVariable[];
  /**
   * The entity secrets
   */
  secrets: YasumuEnvironmentSecret[];
}

export interface YasumuEnvironmentVariable {
  /**
   * The variable key
   */
  key: string;
  /**
   * The variable value
   */
  value: string;
  /**
   * Whether the variable is enabled
   */
  enabled: boolean;
}

export interface YasumuEnvironmentSecret {
  /**
   * The secret key
   */
  key: string;
  /**
   * Whether the secret is enabled
   */
  enabled: boolean;
}

export type YasumuEnvironmentEntityData = Record<
  string,
  YasumuEnvironmentEntity
>;

export class YasumuEnvironment {
  private data!: YasumuEnvironmentEntity;
  public constructor(
    public readonly manager: YasumuEnvironmentManager,
    data: Partial<YasumuEnvironmentEntity>,
  ) {
    this.#reformat(data);
  }

  #reformat(data: Partial<YasumuEnvironmentEntity>) {
    this.data ??= deepMerge({}, data);
    this.data.createdAt ??= Date.now();
    this.data.id ??= generateId();
    this.data.name ??= 'Untitled environment';
    this.data.variables ??= [];
    this.data.secrets ??= [];
  }

  /**
   * The creation date of this environment.
   */
  public get createdAt(): Date {
    return new Date(this.data.createdAt);
  }

  /**
   * The creation timestamp of this environment.
   */
  public get createdAtTimestamp(): number {
    return this.data.createdAt;
  }

  /**
   * The ID of this environment.
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
   * The variables of this environment.
   */
  public get variables(): YasumuEnvironmentVariable[] {
    return this.data.variables;
  }

  /**
   * The secrets of this environment.
   */
  public get secrets(): YasumuEnvironmentSecret[] {
    return this.data.secrets;
  }

  /**
   * Get secrets with their values.
   */
  public async getSecretsWithValues(): Promise<
    (YasumuEnvironmentSecret & { value: string })[]
  > {
    return Promise.all(
      this.data.secrets.map(async (secret) => {
        return {
          ...secret,
          value:
            (await this.manager.workspace.yasumu.store.get(
              this.#getKey(secret.key),
            )) ?? '',
        };
      }),
    );
  }

  /**
   * Sets the name of this environment.
   * @param name The new name.
   */
  public async setName(name: string) {
    this.data.name = name;

    await this.save();

    this.#emitUpdate();
  }

  /**
   * Delete this environment.
   */
  public async delete() {
    return this.manager.deleteEnvironment(this.data.id);
  }

  /**
   * Clone this environment.
   */
  public async clone() {
    const newName = this.data.name.replace(/(\d+)?$/, (match, num) => {
      if (num) return String(Number(num) + 1);
      return ' 2';
    });

    const cloned = await this.manager.createEnvironment({
      name: newName,
      id: generateId(),
    });

    cloned.data.variables = this.data.variables.map((variable) => ({
      ...variable,
    }));
    cloned.data.secrets = this.data.secrets.map((secret) => ({ ...secret }));

    await cloned.save();

    return cloned;
  }

  /**
   * Get the variable by its key.
   * @param key The variable key.
   * @returns The variable.
   */
  public async getVariable(
    key: string,
  ): Promise<YasumuEnvironmentVariable | null> {
    return this.data.variables.find((variable) => variable.key === key) ?? null;
  }

  /**
   * Get the secret by its key.
   * @param key The secret key.
   * @returns The secret.
   */
  public async getSecret(
    key: string,
  ): Promise<(YasumuEnvironmentSecret & { value: string }) | null> {
    const secret =
      this.data.secrets.find((variable) => variable.key === key) ?? null;
    if (!secret) return null;

    return {
      ...secret,
      value:
        (await this.manager.workspace.yasumu.store.get(this.#getKey(key))) ??
        '',
    };
  }

  /**
   * Update the variable by its key if it exists.
   * @param data The new variable data.
   */
  public async updateVariable(
    key: string,
    data: Partial<YasumuEnvironmentVariable>,
  ) {
    const variable = this.getVariable(key);

    if (variable) {
      Object.assign(variable, data);
    }

    await this.save();

    this.#emitUpdate();
  }

  /**
   * Update the secret by its key if it exists.
   * @param data The new secret data.
   */
  public async updateSecret(
    key: string,
    data: Partial<
      YasumuEnvironmentSecret & {
        value: string;
      }
    >,
  ) {
    const secret = await this.getSecret(key);

    if (secret) {
      Object.assign(secret, data);
      if (secret.value !== data.value) {
        const storeKey = this.#getKey(data.key || key);
        const store = this.manager.workspace.yasumu.store;

        await store.set(storeKey, data.value);
      }
    }

    await this.save();

    this.#emitUpdate();
  }

  /**
   * Select this environment.
   */
  public async select() {
    return this.manager.selectEnvironment(this.data.id);
  }

  /**
   * Unselect this environment.
   */
  public async unselect() {
    return this.manager.selectEnvironment('');
  }

  /**
   * Add a new variable to this environment.
   * @param key The variable key.
   * @param value The variable value.
   */
  public async addVariable(variable: Partial<YasumuEnvironmentVariable>) {
    if (this.data.variables.some((v) => v.key === variable.key)) return;

    this.data.variables.push({
      enabled: variable.enabled ?? true,
      key: variable.key ?? '',
      value: variable.value ?? '',
    });

    await this.save();

    this.#emitUpdate();
  }

  /**
   * Add a new variable to this environment.
   * @param key The variable key.
   * @param value The variable value.
   */
  public async addSecret(
    secret: Partial<
      YasumuEnvironmentSecret & {
        value: string;
      }
    >,
  ) {
    if (this.data.secrets.some((v) => v.key === secret.key)) return;

    this.data.secrets.push({
      enabled: secret.enabled ?? true,
      key: secret.key ?? '',
    });

    if (secret.key && secret.value) {
      const workspace = this.manager.workspace;
      await workspace.yasumu.store.set(this.#getKey(secret.key), secret.value);
    }

    await this.save();

    this.#emitUpdate();
  }

  /**
   * Set the value of a variable. If the variable does not exist, it will be created.
   * @param key The variable key.
   * @param value The variable value.
   */
  public async setVariable(key: string, value: string) {
    const variable = await this.getVariable(key);

    if (variable) {
      variable.value = value;
    } else {
      this.data.variables.push({
        enabled: true,
        key,
        value,
      });
    }

    await this.save();

    this.#emitUpdate();
  }

  /**
   * Set the value of a secret. If the secret does not exist, it will be created.
   * @param key The secret key.
   * @param value The secret value.
   */
  public async setSecret(key: string, value: string) {
    const secret = await this.getSecret(key);

    if (secret) {
      secret.value = value;
    } else {
      this.data.secrets.push({
        enabled: true,
        key,
      });
    }

    await this.manager.workspace.yasumu.store.set(this.#getKey(key), value);
    await this.save();

    this.#emitUpdate();
  }

  #emitUpdate() {
    this.manager.workspace.events.emit(
      YasumuWorkspaceEvents.EnvironmentUpdated,
      this,
    );
  }

  #getKey(key: string) {
    return `secrets::${this.manager.workspace.getMetadata().id}::${this.data.id}::${key}`;
  }

  public isSelected() {
    return this.manager.getSelectedEnvironment()?.id === this.data.id;
  }

  /**
   * Save this environment.
   */
  public async save() {
    const metadata = this.manager.workspace.getMetadata();
    const data = metadata.getRawData();

    data.blocks.Environment.environments[this.data.id] = this.toJSON();

    await metadata.save();
  }

  /**
   * JSON representation of this environment.
   */
  public toJSON(): YasumuEnvironmentEntity {
    return this.data;
  }
}
