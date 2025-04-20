import type { Callback } from './common.js';

export type EventCallback<T extends unknown[] = void[]> = Callback<T, void>;

export interface EventsCommon {
  emit(event: string, payload?: unknown): Promise<void>;
  emitTo(
    target: EventTarget | string,
    event: string,
    payload?: unknown,
  ): Promise<void>;
  listen<T extends unknown[]>(
    event: string,
    callback: EventCallback<T>,
  ): Promise<Callback>;
  once<T extends unknown[]>(
    event: string,
    callback: EventCallback<T>,
  ): Promise<Callback>;
}
