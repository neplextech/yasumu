import type { TabularPair } from '@yasumu/common';

export class EnvironmentVariable {
  /**
   * The store of the environment variables.
   */
  private readonly store: Map<string, TabularPair>;

  /**
   * Represents the environment variable manager.
   * @param onUpdate The function to call when the environment variable is updated.
   */
  public constructor(
    private onUpdate: () => Promise<void>,
    data: TabularPair[],
  ) {
    this.store = new Map(data.map((item) => [item.key, item]));
  }

  /**
   * Sets the value of an environment variable.
   * @param key The key of the environment variable.
   * @param value The value of the environment variable.
   * @param enabled Whether the environment variable is enabled.
   */
  public async set(
    key: string,
    value: string,
    enabled?: boolean,
  ): Promise<void> {
    const pair: TabularPair = {
      key,
      value,
      enabled: enabled ?? this.store.get(key)?.enabled ?? true,
    };

    this.store.set(key, pair);

    await this.onUpdate();
  }

  /**
   * Gets the raw value of an environment variable.
   * @param key The key of the environment variable.
   * @returns The raw value of the environment variable.
   */
  public getRaw(key: string): TabularPair | null {
    return this.store.get(key) ?? null;
  }

  /**
   * Gets the value of an environment variable.
   * @param key The key of the environment variable.
   * @returns The value of the environment variable.
   */
  public get(key: string): TabularPair | null {
    const entry = this.store.get(key);
    return entry?.enabled ? entry : null;
  }

  /**
   * Deletes an environment variable.
   * @param key The key of the environment variable.
   */
  public async delete(key: string): Promise<void> {
    this.store.delete(key);
    await this.onUpdate();
  }

  /**
   * Clears all environment variables.
   */
  public async clear(): Promise<void> {
    this.store.clear();
    await this.onUpdate();
  }

  /**
   * The JSON representation of the environment variables.
   */
  public toJSON(): TabularPair[] {
    return Array.from(this.store.values());
  }

  /**
   * Get the keys of the environment variables.
   */
  public getKeys(): string[] {
    return Array.from(this.store.keys());
  }
}
