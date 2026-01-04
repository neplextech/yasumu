import { op_send_renderer_event } from 'ext:core/ops';
import { createBufferedQueue } from './common.ts';
import { isMainThread } from 'node:worker_threads';

export const isWorkerEnvironment = () =>
  !isMainThread ||
  // @ts-ignore types
  (typeof WorkerGlobalScope !== 'undefined' &&
    // @ts-ignore types
    self instanceof WorkerGlobalScope);

export interface RendererEvent {
  type: 'message' | 'console' | 'show-notification';
  payload: unknown;
}

/**
 * Queue for processing renderer events. This can buffer up to 500 events at a time.
 * The events are buffered until the Yasumu runtime is ready and executed immediately after.
 */
export const rendererEventQueue = createBufferedQueue<RendererEvent>({
  shouldBuffer: () => !Yasumu.isReady(),
  capacity: 500,
  onData: (message) => op_send_renderer_event(JSON.stringify(message)),
});

export interface ConsoleEvent {
  msg: string;
  level: number;
}

/**
 * Queue for processing console events. This can buffer up to 100 events at a time.
 * The events are buffered until the Yasumu runtime is ready and executed immediately after.
 */
export const consoleEventQueue = createBufferedQueue<ConsoleEvent>({
  shouldBuffer: () => !Yasumu.isReady(),
  capacity: 100,
  onData: (message) =>
    op_send_renderer_event(
      JSON.stringify({
        type: 'console',
        payload: message,
      }),
    ),
});
