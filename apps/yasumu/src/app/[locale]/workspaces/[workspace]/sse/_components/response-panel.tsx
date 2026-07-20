'use client';

import type { SseEvent, TestResult } from '@yasumu/core';
import { Badge } from '@yasumu/ui/components/badge';
import { Button } from '@yasumu/ui/components/button';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@yasumu/ui/components/tabs';
import { Trash2 } from 'lucide-react';

import { ConsoleView } from '@/app/[locale]/workspaces/[workspace]/rest/_components/response-panel/console-view';
import { HeadersView } from '@/app/[locale]/workspaces/[workspace]/rest/_components/response-panel/headers-view';
import { TestView } from '@/app/[locale]/workspaces/[workspace]/rest/_components/response-panel/test-view';
import YasumuLogo from '@/components/visuals/yasumu-logo';

import type { RequestPhase, ScriptOutputEntry } from '../_hooks/use-sse-request';
import type { SseConnectionResponse } from '../_hooks/use-sse-request';

interface SseResponsePanelProps {
  phase: RequestPhase;
  connected: boolean;
  response: SseConnectionResponse | null;
  events: SseEvent[];
  error: string | null;
  scriptOutput: ScriptOutputEntry[];
  testResults: TestResult[];
  onClearEvents(): void;
}

function formattedData(data: string): string {
  try {
    return JSON.stringify(JSON.parse(data), null, 2);
  } catch {
    return data;
  }
}

function EventsView({ events, waiting }: { events: SseEvent[]; waiting: boolean }) {
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

export function SseResponsePanel(props: SseResponsePanelProps) {
  if (props.phase === 'idle') {
    return (
      <div className="bg-muted/5 text-muted-foreground flex h-full flex-col items-center justify-center gap-2 select-none">
        <div className="opacity-20 grayscale">
          <YasumuLogo width={64} height={64} />
        </div>
        <p className="text-sm">Connect to see streamed events</p>
      </div>
    );
  }

  const active =
    props.phase === 'sending' || props.phase === 'pre-request-script' || props.phase === 'post-response-script';
  return (
    <div className="bg-background flex h-full min-h-0 flex-col">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b px-3">
        <Badge variant={props.connected ? 'default' : props.phase === 'error' ? 'destructive' : 'outline'}>
          {props.connected ? 'Live' : active ? 'Connecting' : props.phase === 'error' ? 'Failed' : 'Closed'}
        </Badge>
        {props.response ? (
          <span className="font-mono text-xs">
            {props.response.status} {props.response.statusText}
          </span>
        ) : null}
        <span className="text-muted-foreground font-mono text-xs">{props.events.length} events</span>
        {props.response?.reconnects ? (
          <span className="text-muted-foreground font-mono text-xs">{props.response.reconnects} reconnects</span>
        ) : null}
        {props.error ? <span className="text-destructive ml-auto truncate text-xs">{props.error}</span> : null}
      </div>
      <Tabs defaultValue="events" className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center border-b px-1">
          <TabsList className="h-10 flex-1 justify-start gap-2 bg-transparent">
            <TabsTrigger value="events">Events ({props.events.length})</TabsTrigger>
            <TabsTrigger value="headers">Headers ({Object.keys(props.response?.headers ?? {}).length})</TabsTrigger>
            <TabsTrigger value="console">Console ({props.scriptOutput.length})</TabsTrigger>
            <TabsTrigger value="tests">Tests ({props.testResults.length})</TabsTrigger>
          </TabsList>
          <Button type="button" variant="ghost" size="sm" onClick={props.onClearEvents} disabled={!props.events.length}>
            <Trash2 data-icon="inline-start" /> Clear
          </Button>
        </div>
        <TabsContent value="events" className="min-h-0 flex-1">
          <EventsView events={props.events} waiting={active} />
        </TabsContent>
        <TabsContent value="headers" className="min-h-0 flex-1">
          <HeadersView headers={props.response?.headers ?? {}} />
        </TabsContent>
        <TabsContent value="console" className="min-h-0 flex-1">
          <ConsoleView output={props.scriptOutput} />
        </TabsContent>
        <TabsContent value="tests" className="min-h-0 flex-1">
          <TestView results={props.testResults} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
