export class AsyncMutex {
  private locked = false;
  private queue: Array<() => void> = [];

  public async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }

    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  public release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }

  public async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

export class KeyedMutex {
  private mutexes = new Map<string, AsyncMutex>();

  public getMutex(key: string): AsyncMutex {
    let mutex = this.mutexes.get(key);
    if (!mutex) {
      mutex = new AsyncMutex();
      this.mutexes.set(key, mutex);
    }
    return mutex;
  }

  public async runExclusive<T>(key: string, fn: () => Promise<T>): Promise<T> {
    return this.getMutex(key).runExclusive(fn);
  }
}
