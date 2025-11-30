export type EventHandler = (...args: any[]) => any;
export type AnyEventHandler = Record<string, EventHandler>;

export interface EventOptions {
  /**
   * An optional AbortSignal to abort the event listener.
   */
  signal?: AbortSignal;
}

export class YasumuEventBus<T extends Record<keyof T, EventHandler>> {
  private readonly handlers = new Map<keyof T, EventHandler[]>();

  /**
   * A handler that is called for any event emitted.
   */
  public onAnyEvent?: (event: keyof T, ...args: any[]) => unknown;

  /**
   * Emits an event and calls all handlers for that event.
   * @param event  The event to emit.
   * @param args   The arguments to pass to the handler.
   */
  public emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): void {
    const handlers = this.handlers.get(event);
    const promises: Promise<unknown>[] = [];

    if (handlers) {
      promises.push(
        ...[...handlers].map((handler) => Promise.resolve(handler(...args))),
      );
    }

    if (this.onAnyEvent) {
      promises.push(Promise.resolve(this.onAnyEvent(event, ...args)));
    }

    if (promises.length > 0) {
      Promise.all(promises).catch((error) => {
        console.error('Error in event handler:', error);
      });
    }
  }

  /**
   * Registers an event handler.
   * @param event    The event to register.
   * @param handler  The handler to call.
   * @param options  Options for the event listener.
   * @returns        A function to unregister the event handler.
   */
  public on<K extends keyof T>(
    event: K,
    handler: T[K],
    options?: EventOptions,
  ): () => void {
    if (options?.signal?.aborted) {
      return () => {};
    }

    const handlers = this.handlers.get(event) || [];
    handlers.push(handler);
    this.handlers.set(event, handlers);

    const unregister = () => this.off(event, handler);

    if (options?.signal) {
      options.signal.addEventListener('abort', unregister, { once: true });
    }

    return unregister;
  }

  /**
   * Registers an event handler that runs only once.
   * @param event    The event to register.
   * @param handler  The handler to call.
   * @param options  Options for the event listener.
   * @returns        A function to unregister the event handler.
   */
  public once<K extends keyof T>(
    event: K,
    handler: T[K],
    options?: EventOptions,
  ): () => void {
    if (options?.signal?.aborted) {
      return () => {};
    }

    const wrappedHandler = ((...args: Parameters<T[K]>) => {
      this.off(event, wrappedHandler as T[K]);
      return handler(...args);
    }) as T[K];

    (wrappedHandler as any).__originalHandler = handler;

    return this.on(event, wrappedHandler, options);
  }

  /**
   * Unregisters an event handler.
   * @param event    The event to unregister.
   * @param handler  The handler to unregister. If not provided, all handlers for the event are removed.
   */
  public off<K extends keyof T>(event: K, handler?: T[K]) {
    if (!handler) {
      this.handlers.delete(event);
      return;
    }

    const handlers = this.handlers.get(event);
    if (!handlers) return;

    const newHandlers = handlers.filter(
      (h) => h !== handler && (h as any).__originalHandler !== handler,
    );

    if (newHandlers.length === 0) {
      this.handlers.delete(event);
    } else {
      this.handlers.set(event, newHandlers);
    }
  }
}
