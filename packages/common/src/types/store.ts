import type { Callback } from './common.js';

export interface StoreCommon {
  delete(key: string): Promise<boolean>;
  entries<T = unknown>(): Promise<[string, T][]>;
  get<T = unknown>(key: string): Promise<T | null>;
  has(key: string): Promise<boolean>;
  keys(): Promise<string[]>;
  length(): Promise<number>;
  load(): Promise<void>;
  onChange<T extends unknown>(
    cb: Callback<[key: string, value: T]>,
  ): Promise<Callback>;
  onKeyChange<T extends unknown>(
    key: string,
    cb: Callback<[value: T]>,
  ): Promise<Callback>;
  reset(): Promise<void>;
  save(): Promise<void>;
  set(key: string, value: unknown): Promise<void>;
  values<T = unknown>(): Promise<T[]>;
}

export interface StoreOptions {
  autoSave?: boolean;
  createNew?: boolean;
  deserializeFnName?: string;
  serializeFnName?: string;
}
