import { Injectable } from '../di/decorators.js';
import type { Type } from '../types.js';
import { Observable, type Observer } from './observable.js';

export interface IEvent {}

@Injectable()
export class EventBus {
  private observers = new Set<Observer<any>>();

  publish<T = any>(event: T): Promise<void[]> {
    const promises = Array.from(this.observers).map((observer) =>
      observer(event),
    );
    return Promise.all(promises);
  }

  ofType<T extends IEvent>(type: Type<T>): Observable<T> {
    return new Observable<T>((observer) => {
      const wrappedObserver: Observer<any> = async (event) => {
        if (event instanceof type) {
          await observer(event);
        }
      };

      this.observers.add(wrappedObserver);

      return {
        unsubscribe: () => {
          this.observers.delete(wrappedObserver);
        },
      };
    });
  }
}
