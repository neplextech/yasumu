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

export interface ConsumeSseResponseOptions {
  response: Response;
  signal: AbortSignal;
  initialLastEventId?: string;
  eventTypes?: readonly string[];
  maxEvents?: number;
  onRetry?(retryMs: number): void;
  onEvent(event: SseEvent): void | Promise<void>;
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
    if (!response.ok) return { response, events };
    const remaining = maxEvents - events.length;
    const received = await consumeSseResponse({
      response,
      signal: options.signal,
      initialLastEventId: lastEventId,
      eventTypes: [...accepted],
      maxEvents: remaining,
      onRetry: (value) => {
        retryMs = value;
      },
      onEvent: options.onEvent,
    });
    events.push(...received);
    for (let index = received.length - 1; index >= 0; index -= 1) {
      const event = received[index];
      if (event?.id === undefined) continue;
      lastEventId = event.id;
      break;
    }

    if (!options.reconnect || events.length >= maxEvents) break;
    await abortableDelay(retryMs, options.signal);
  }

  return {
    response: createSseSnapshotResponse(
      new Response(null, responseMetadata ?? { status: 200, statusText: 'OK', headers: new Headers() }),
      events,
    ),
    events,
  };
}

export async function consumeSseResponse(options: ConsumeSseResponseOptions): Promise<SseEvent[]> {
  if (!options.response.ok) return [];
  if (!isSseResponse(options.response)) {
    throw new YasumuError(YasumuErrorCodes.RequestFailed, 'SSE response must use text/event-stream');
  }
  if (!options.response.body) throw new YasumuError(YasumuErrorCodes.RequestFailed, 'SSE response body is empty');

  const events: SseEvent[] = [];
  const accepted = new Set(options.eventTypes?.filter(Boolean) ?? []);
  const maxEvents = options.maxEvents && options.maxEvents > 0 ? options.maxEvents : Number.POSITIVE_INFINITY;
  for await (const event of parseSseStream(options.response.body, {
    signal: options.signal,
    initialLastEventId: options.initialLastEventId,
    onRetry: options.onRetry,
  })) {
    if (accepted.size && !accepted.has(event.event)) continue;
    events.push(event);
    await options.onEvent(event);
    if (events.length >= maxEvents) break;
  }
  return events;
}

export function isSseResponse(response: Response): boolean {
  return response.headers.get('content-type')?.toLowerCase().includes('text/event-stream') ?? false;
}

export function createSseSnapshotResponse(response: Response, events: readonly SseEvent[]): Response {
  const headers = new Headers(response.headers);
  headers.set('content-type', 'application/json');
  headers.set('x-yasumu-sse-events', String(events.length));
  headers.set('x-yasumu-original-content-type', 'text/event-stream');
  return new Response(JSON.stringify({ events }), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
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
