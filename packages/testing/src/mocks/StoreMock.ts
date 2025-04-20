import type { Callback, StoreCommon } from '@yasumu/common';

export class StoreMock implements StoreCommon {
  #store = new Map<string, unknown>();

  public constructor(private readonly name: string) {}

  public async delete(key: string): Promise<boolean> {
    return this.#store.delete(key);
  }
  public async entries<T = unknown>(): Promise<[string, T][]> {
    return Array.from(this.#store.entries()) as [string, T][];
  }
  public async get<T = unknown>(key: string): Promise<T | null> {
    return this.#store.get(key) as T;
  }
  public async has(key: string): Promise<boolean> {
    return this.#store.has(key);
  }
  public async keys(): Promise<string[]> {
    return Array.from(this.#store.keys());
  }
  public async length(): Promise<number> {
    return this.#store.size;
  }
  public async load(): Promise<void> {}
  public async onChange<T extends unknown>(
    cb: Callback<[key: string, value: T]>,
  ): Promise<Callback> {
    return () => {};
  }
  public async onKeyChange<T extends unknown>(
    key: string,
    cb: Callback<[value: T]>,
  ): Promise<Callback> {
    return () => {};
  }
  public async reset(): Promise<void> {
    this.#store.clear();
  }
  public async save(): Promise<void> {}
  public async set(key: string, value: unknown): Promise<void> {
    this.#store.set(key, value);
  }
  public async values<T = unknown>(): Promise<T[]> {
    return Array.from(this.#store.values()) as T[];
  }
}
