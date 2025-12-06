export interface Subscription {
  unsubscribe(): void;
}

export type Observer<T> = (value: T) => void | Promise<void>;

export class Observable<T> {
  constructor(
    private readonly _subscribe: (observer: Observer<T>) => Subscription,
  ) {}

  subscribe(observer: Observer<T>): Subscription {
    return this._subscribe(observer);
  }

  filter(predicate: (value: T) => boolean): Observable<T> {
    return new Observable((observer) => {
      const subscription = this.subscribe(async (value) => {
        if (predicate(value)) {
          await observer(value);
        }
      });
      return subscription;
    });
  }
}
