import { setImmediate } from 'node:timers';

type Resolver<T> = {
  resolve: () => void;
  reject: (error: unknown) => void;
  data: T;
};

/**
 * Creates a buffered queue that can buffer up to a given number of events.
 * The events are buffered until the Yasumu runtime is ready and executed immediately after.
 * @param capacity The maximum number of events to buffer
 * @param shouldBuffer A function that returns true if the event should be buffered
 * @param onData A function that processes the event
 * @returns A processor object that can be used to enqueue events
 */
export function createBufferedQueue<T>({
  capacity = 100,
  shouldBuffer,
  onData,
}: {
  capacity?: number;
  shouldBuffer: () => boolean;
  onData: (message: T) => void;
}) {
  const queue: Resolver<T>[] = [];

  const processEntry = (entry: Resolver<T>) => {
    try {
      onData(entry.data);
      entry.resolve();
    } catch (e) {
      entry.reject(e ?? new Error('Unknown error occurred'));
    }
  };

  let _readyListener = false;

  const processor = {
    enqueue(message: T) {
      if (!_readyListener) {
        Yasumu.onReady(() => processor.flush());
        _readyListener = true;
      }

      const { promise, resolve, reject } = Promise.withResolvers<void>();
      const entry: Resolver<T> = { resolve, reject, data: message };

      if (shouldBuffer()) {
        queue.push(entry);

        if (queue.length >= capacity) {
          queue.splice(0, queue.length - capacity);
        }

        return promise;
      }

      // schedule the flush to be called in the future
      setImmediate(() => {
        // flush the queue
        this.flush();
        // manually process the entry since it wasn't buffered
        processEntry(entry);
      });

      return promise;
    },
    flush() {
      if (queue.length < 1) return;

      for (const entry of queue) {
        processEntry(entry);
      }

      queue.length = 0;
    },
  };

  return processor;
}
