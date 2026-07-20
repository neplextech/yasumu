import type { SseEvent } from '@yasumu/runtime-api';

import { YasumuError, YasumuErrorCodes } from './errors.js';

export interface ConsumeSseOptions {
  signal: AbortSignal;
  reconnect: boolean;
  retryMs: number;
  maxEvents?: number;
  eventTypes?: readonly string[];
  open(lastEventId?: string): Promise<Response>;
  onOpen?(response: Response, reconnected: boolean): void | Promise<void>;
  onEvent(event: SseEvent): void | Promise<void>;
}

export interface ConsumedSseStream {
  response: Response;
  events: SseEvent[];
}

export async function consumeSse(options: ConsumeSseOptions): Promise<ConsumedSseStream> {
  const events: SseEvent[] = [];
  const accepted = new Set(options.eventTypes?.filter(Boolean) ?? []);
  const maxEvents = options.maxEvents && options.maxEvents > 0 ? options.maxEvents : Number.POSITIVE_INFINITY;
  let retryMs = Math.max(0, options.retryMs);
  let lastEventId: string | undefined;
  let responseMetadata: { status: number; statusText: string; headers: Headers } | undefined;

  while (events.length < maxEvents) {
    options.signal.throwIfAborted();
    const response = await options.open(lastEventId);
    await options.onOpen?.(response, responseMetadata !== undefined);
    responseMetadata ??= {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    };
    if (!response.ok) {
      return { response, events };
    }
    if (!response.headers.get('content-type')?.toLowerCase().includes('text/event-stream')) {
      throw new YasumuError(YasumuErrorCodes.RequestFailed, 'SSE response must use text/event-stream');
    }
    if (!response.body) throw new YasumuError(YasumuErrorCodes.RequestFailed, 'SSE response body is empty');

    for await (const event of parseSseStream(response.body, {
      signal: options.signal,
      initialLastEventId: lastEventId,
      onRetry: (value) => {
        retryMs = value;
      },
    })) {
      if (event.id !== undefined) lastEventId = event.id;
      if (accepted.size && !accepted.has(event.event)) continue;
      events.push(event);
      await options.onEvent(event);
      if (events.length >= maxEvents) break;
    }

    if (!options.reconnect || events.length >= maxEvents) break;
    await abortableDelay(retryMs, options.signal);
  }

  const metadata = responseMetadata ?? { status: 200, statusText: 'OK', headers: new Headers() };
  const headers = new Headers(metadata.headers);
  headers.set('content-type', 'application/json');
  headers.set('x-yasumu-sse-events', String(events.length));
  return {
    response: new Response(JSON.stringify({ events }), {
      status: metadata.status,
      statusText: metadata.statusText,
      headers,
    }),
    events,
  };
}

export async function* parseSse(stream: ReadableStream<Uint8Array>, signal?: AbortSignal): AsyncGenerator<SseEvent> {
  yield* parseSseStream(stream, { signal });
}

interface ParseSseStreamOptions {
  signal?: AbortSignal;
  initialLastEventId?: string;
  onRetry?(retryMs: number): void;
}

async function* parseSseStream(
  stream: ReadableStream<Uint8Array>,
  options: ParseSseStreamOptions,
): AsyncGenerator<SseEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let data: string[] = [];
  let eventName = '';
  let lastEventId = options.initialLastEventId;
  let retry: number | undefined;
  let firstLine = true;
  let completed = false;

  const dispatch = (): SseEvent | undefined => {
    if (!data.length) return undefined;
    const event: SseEvent = {
      id: lastEventId,
      event: eventName || 'message',
      data: data.join('\n'),
      retry,
      receivedAt: Date.now(),
    };
    data = [];
    eventName = '';
    retry = undefined;
    return event;
  };

  options.signal?.addEventListener('abort', abort, { once: true });
  try {
    while (true) {
      options.signal?.throwIfAborted();
      const { done, value } = await reader.read();
      if (done) completed = true;
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split(/\r\n|\r|\n/);
      buffer = done ? '' : (lines.pop() ?? '');
      for (const rawLine of lines) {
        const line = firstLine && rawLine.startsWith('\uFEFF') ? rawLine.slice(1) : rawLine;
        firstLine = false;
        if (!line) {
          const event = dispatch();
          if (event) yield event;
          continue;
        }
        if (line.startsWith(':')) continue;
        const separator = line.indexOf(':');
        const field = separator < 0 ? line : line.slice(0, separator);
        let value = separator < 0 ? '' : line.slice(separator + 1);
        if (value.startsWith(' ')) value = value.slice(1);
        if (field === 'data') data.push(value);
        else if (field === 'event') eventName = value;
        else if (field === 'id' && !value.includes('\0')) lastEventId = value;
        else if (field === 'retry' && /^\d+$/.test(value)) {
          retry = Number(value);
          options.onRetry?.(retry);
        }
      }
      if (done) {
        const event = dispatch();
        if (event) yield event;
        break;
      }
    }
  } finally {
    options.signal?.removeEventListener('abort', abort);
    if (!completed) {
      try {
        await reader.cancel(options.signal?.reason);
      } catch {
        // Cancellation is best-effort; the execution result remains authoritative.
      }
    }
    reader.releaseLock();
  }

  function abort() {
    void reader.cancel(options.signal?.reason);
  }
}

function abortableDelay(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, ms);
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    };
    signal.addEventListener('abort', abort, { once: true });
  });
}
