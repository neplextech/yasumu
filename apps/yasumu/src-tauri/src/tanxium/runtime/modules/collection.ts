// deno-lint-ignore-file no-explicit-any
import { randomInt } from 'node:crypto';

/**
 * A superset of Map with additional utility methods similar to those found in arrays.
 */
export class Collection<K = any, V = any> extends Map<K, V> {
  /**
   * Get one or more random values from the collection.
   * @param n The number of random values to get. If not provided, a single random value is returned.
   */
  public random(): V | undefined;
  public random(n: number): V[];
  public random(n = 1): V | V[] | undefined {
    const values = Array.from(this.values());

    if (n === 1) {
      if (values.length === 0) return undefined;
      const index = randomInt(0, values.length);
      return values[index];
    } else {
      const results: V[] = [];
      const usedIndices = new Set<number>();
      n = Math.min(n, values.length);

      while (results.length < n) {
        const index = randomInt(0, values.length);
        if (!usedIndices.has(index)) {
          usedIndices.add(index);
          results.push(values[index]);
        }
      }
      return results;
    }
  }

  /**
   * Creates a shallow copy of the collection.
   * @returns A new Collection instance with the same key-value pairs.
   */
  public clone(): Collection<K, V> {
    return new Collection<K, V>(this.entries());
  }

  /**
   * Finds the first value that satisfies the provided predicate function.
   * @param predicate A function that tests each value in the collection.
   * @returns The first value that satisfies the predicate, or undefined if none do.
   */
  public find<T>(
    predicate: (value: V, key: K, collection: this) => boolean,
  ): V | undefined {
    for (const [key, value] of this) {
      if (predicate(value, key, this)) {
        return value;
      }
    }
  }

  /**
   * Creates a new collection with all values that pass the test implemented by the provided function.
   * @param predicate A function that tests each value in the collection.
   * @returns A new Collection containing the values that pass the test.
   */
  public filter(
    predicate: (value: V, key: K, collection: this) => boolean,
  ): Collection<K, V> {
    const results = new Collection<K, V>();
    for (const [key, value] of this) {
      if (predicate(value, key, this)) {
        results.set(key, value);
      }
    }
    return results;
  }

  /**
   * Creates an array of values by applying a function to each value in the collection.
   * @param mapper A function that transforms each value in the collection.
   * @returns An array of transformed values.
   */
  public map<T>(mapper: (value: V, key: K, collection: this) => T): T[] {
    const results: T[] = [];
    for (const [key, value] of this) {
      results.push(mapper(value, key, this));
    }
    return results;
  }

  /**
   * Returns true if at least one value in the collection satisfies the provided predicate function.
   * @param predicate A function that tests each value in the collection.
   * @returns True if at least one value satisfies the predicate, otherwise false.
   */
  public some(
    predicate: (value: V, key: K, collection: this) => boolean,
  ): boolean {
    for (const [key, value] of this) {
      if (predicate(value, key, this)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns true if all values in the collection satisfy the provided predicate function.
   * @param predicate A function that tests each value in the collection.
   * @returns True if all values satisfy the predicate, otherwise false.
   */
  public every(
    predicate: (value: V, key: K, collection: this) => boolean,
  ): boolean {
    for (const [key, value] of this) {
      if (!predicate(value, key, this)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Reduces the collection to a single value by applying a reducer function to each value.
   * @param reducer A function that combines an accumulator with each value in the collection.
   * @param initialValue The initial value for the accumulator.
   * @returns The final accumulated value.
   */
  public reduce<T>(
    reducer: (accumulator: T, value: V, key: K, collection: this) => T,
    initialValue: T,
  ): T {
    let accumulator = initialValue;
    for (const [key, value] of this) {
      accumulator = reducer(accumulator, value, key, this);
    }
    return accumulator;
  }

  /**
   * Converts the collection to an array of its values.
   * @returns An array containing all values in the collection.
   */
  public toArray(): V[] {
    return Array.from(this.values());
  }
}

interface CacheEntry<V> {
  /**
   * The cached value.
   */
  value: V;
  /**
   * The expiration timestamp in milliseconds, or null if it does not expire.
   */
  expiresAt: number | null;
}

export class Cache {
  private _internalCache = new Collection<string, CacheEntry<any>>();

  public set<T>(key: string, value: T, ttlMs?: number) {
    const expiresAt = ttlMs ? Date.now() + ttlMs : null;
    this._internalCache.set(key, { value, expiresAt });
  }

  public get<T = any>(key: string): T | undefined {
    const entry = this._internalCache.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this._internalCache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  public has(key: string): boolean {
    const entry = this._internalCache.get(key);
    if (!entry) return false;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this._internalCache.delete(key);
      return false;
    }

    return true;
  }

  public delete(key: string): boolean {
    return this._internalCache.delete(key);
  }

  public deleteExpired(): void {
    const now = Date.now();

    for (const [key, entry] of this._internalCache) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this._internalCache.delete(key);
      }
    }
  }

  public clear(): void {
    this._internalCache.clear();
  }

  public find<T>(
    predicate: (value: any, key: string) => boolean,
  ): T | undefined {
    for (const [key, entry] of this._internalCache) {
      if (predicate(entry.value, key)) {
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
          this._internalCache.delete(key);
          continue;
        }
        return entry.value;
      }
    }
    return undefined;
  }

  public *[Symbol.iterator](): IterableIterator<[string, any]> {
    for (const [key, entry] of this._internalCache) {
      if (!entry.expiresAt || Date.now() <= entry.expiresAt) {
        yield [key, entry.value];
      } else {
        this._internalCache.delete(key);
      }
    }
  }
}
