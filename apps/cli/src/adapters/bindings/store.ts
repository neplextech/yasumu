import type {
  Callback,
  StoreCommon,
  StoreOptions,
  StoreType,
} from '@yasumu/common';

export class Store implements StoreCommon {
  #store = new Map<string, unknown>();
  #options: StoreOptions;
  #anyChange = new Set<Callback<[key: string, value: any]>>();
  #keys = new Map<string, Callback<[value: any]>>();

  public constructor(
    public readonly name: string,
    options?: StoreOptions,
  ) {
    this.#options = {
      autoSave: true,
      createNew: true,
      ...options,
    };
  }

  public async delete(key: string): Promise<boolean> {
    const result = await this.#transaction(() => this.#store.delete(key));

    if (result) {
      await this.#keys.get(key)?.(null);
      this.#anyChange.forEach((cb) => cb(key, null));
    }

    return result;
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
    this.#anyChange.add(cb);

    return () => {
      this.#anyChange.delete(cb);
    };
  }

  public async onKeyChange<T extends unknown>(
    key: string,
    cb: Callback<[value: T]>,
  ): Promise<Callback> {
    this.#keys.set(key, cb);

    return () => {
      this.#keys.delete(key);
    };
  }

  public async reset(): Promise<void> {
    this.#store.clear();
  }

  public async save(): Promise<void> {}

  public async set(key: string, value: unknown): Promise<void> {
    await this.#transaction(() => this.#store.set(key, value));

    await this.#keys.get(key)?.(value);
    this.#anyChange.forEach((cb) => cb(key, value));
  }

  public async values<T = unknown>(): Promise<T[]> {
    return Array.from(this.#store.values()) as T[];
  }

  async #transaction<R, F extends (store: Map<string, unknown>) => Awaited<R>>(
    cb: F,
  ): Promise<ReturnType<F>> {
    const clone = new Map(this.#store);

    let result: any;

    try {
      result = await cb(clone);
    } catch (error) {
      clone.clear();
      throw error;
    }

    this.#store = clone;

    if (this.#options.autoSave) {
      await this.save();
    }

    return result;
  }
}

export function createStore(): StoreType {
  return async (name, options) => new Store(name, options);
}
