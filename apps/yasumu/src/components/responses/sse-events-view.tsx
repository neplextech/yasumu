'use client';

import type { SseEvent } from '@yasumu/core';
import { Badge } from '@yasumu/ui/components/badge';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';

function formattedData(data: string): string {
  try {
    return JSON.stringify(JSON.parse(data), null, 2);
  } catch {
    return data;
  }
}

export function SseEventsView({ events, waiting }: { events: SseEvent[]; waiting: boolean }) {
  if (!events.length) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center p-6 text-center text-sm">
        {waiting ? 'Connected. Waiting for the first event…' : 'No events received.'}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full" data-allow-context-menu="true">
      <div className="flex flex-col gap-3 p-4 select-text">
        {events.map((event, index) => (
          <article key={`${event.receivedAt}:${event.id ?? index}`} className="bg-muted/20 rounded-md border p-3">
            <header className="mb-3 flex items-center gap-2">
              <Badge variant="secondary">{event.event}</Badge>
              {event.id !== undefined ? (
                <span className="text-muted-foreground font-mono text-xs">#{event.id}</span>
              ) : null}
              {event.retry !== undefined ? (
                <span className="text-muted-foreground font-mono text-xs">retry {event.retry} ms</span>
              ) : null}
              <time
                className="text-muted-foreground ml-auto font-mono text-xs"
                dateTime={new Date(event.receivedAt).toISOString()}
              >
                {new Date(event.receivedAt).toLocaleTimeString()}
              </time>
            </header>
            <pre className="bg-background overflow-x-auto rounded border p-3 font-mono text-xs whitespace-pre-wrap">
              {formattedData(event.data)}
            </pre>
          </article>
        ))}
      </div>
    </ScrollArea>
  );
}
