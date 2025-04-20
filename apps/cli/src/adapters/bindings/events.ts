import type { Callback, EventCallback, EventsCommon } from '@yasumu/common';

export class Events implements EventsCommon {
  public async emit(event: string, payload?: unknown): Promise<void> {}

  public async emitTo(
    target: EventTarget | string,
    event: string,
    payload?: unknown,
  ): Promise<void> {}

  public async listen<T extends unknown[]>(
    event: string,
    callback: EventCallback<T>,
  ): Promise<Callback> {
    return () => {};
  }

  public async once<T extends unknown[]>(
    event: string,
    callback: EventCallback<T>,
  ): Promise<Callback> {
    return () => {};
  }
}

export function createEvents(): EventsCommon {
  return new Events();
}
