'use client';

import { useMemo } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { cn } from '@yasumu/ui/lib/utils';
import LoadingScreen from '@/components/visuals/loading-screen';
import YasumuLogo from '@/components/visuals/yasumu-logo';
import type { RestResponse } from '../_lib/rest-request';
import type { RequestPhase } from '../_hooks/use-rest-request';

interface RestResponsePanelProps {
  phase: RequestPhase;
  response: RestResponse | null;
  error: string | null;
  scriptOutput: string[];
}

function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-green-500';
  if (status >= 300 && status < 400) return 'text-yellow-500';
  if (status >= 400 && status < 500) return 'text-orange-500';
  if (status >= 500) return 'text-red-500';
  return 'text-muted-foreground';
}

function ResponseStatusBar({ response }: { response: RestResponse }) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Status:</span>
        <span
          className={cn(
            'font-mono font-medium',
            getStatusColor(response.status),
          )}
        >
          {response.status} {response.statusText}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Time:</span>
        <span className="font-mono">{response.time.toFixed(0)}ms</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Size:</span>
        <span className="font-mono">{formatBytes(response.size)}</span>
      </div>
    </div>
  );
}

function HeadersView({ headers }: { headers: Record<string, string> }) {
  const entries = Object.entries(headers);

  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm p-4">No headers received</p>
    );
  }

  return (
    <div className="p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 font-medium text-muted-foreground">
              Name
            </th>
            <th className="text-left py-2 font-medium text-muted-foreground">
              Value
            </th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {entries.map(([key, value]) => (
            <tr key={key} className="border-b border-border/50">
              <td className="py-2 pr-4 text-primary">{key}</td>
              <td className="py-2 break-all">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CookiesView({ cookies }: { cookies: string[] }) {
  if (cookies.length === 0) {
    return (
      <p className="text-muted-foreground text-sm p-4">No cookies received</p>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {cookies.map((cookie, i) => (
        <pre
          key={i}
          className="text-sm font-mono bg-muted/50 p-2 rounded break-all whitespace-pre-wrap"
        >
          {cookie}
        </pre>
      ))}
    </div>
  );
}

function BodyView({
  body,
  headers,
}: {
  body: string;
  headers: Record<string, string>;
}) {
  const formatted = useMemo(() => {
    const contentType = Object.entries(headers).find(
      ([key]) => key.toLowerCase() === 'content-type',
    )?.[1];

    if (contentType?.includes('application/json')) {
      try {
        return JSON.stringify(JSON.parse(body), null, 2);
      } catch {
        return body;
      }
    }

    return body;
  }, [body, headers]);

  if (!body) {
    return (
      <p className="text-muted-foreground text-sm p-4">Empty response body</p>
    );
  }

  return (
    <ScrollArea className="h-full">
      <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-all">
        <code>{formatted}</code>
      </pre>
    </ScrollArea>
  );
}

function ConsoleView({ output }: { output: string[] }) {
  if (output.length === 0) {
    return (
      <p className="text-muted-foreground text-sm p-4">No script output</p>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-1">
        {output.map((line, i) => (
          <pre
            key={i}
            className={cn(
              'text-sm font-mono',
              line.includes('error') || line.includes('failed')
                ? 'text-red-400'
                : line.includes('success')
                  ? 'text-green-400'
                  : 'text-foreground',
            )}
          >
            {line}
          </pre>
        ))}
      </div>
    </ScrollArea>
  );
}

export function RestResponsePanel({
  phase,
  response,
  error,
  scriptOutput,
}: RestResponsePanelProps) {
  const phaseMessages: Record<RequestPhase, string> = {
    idle: '',
    'pre-request-script': 'Running pre-request script...',
    sending: 'Sending request...',
    'post-response-script': 'Running post-response script...',
    completed: '',
    error: '',
    cancelled: '',
  };

  if (
    phase === 'pre-request-script' ||
    phase === 'sending' ||
    phase === 'post-response-script'
  ) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-background/50">
        <LoadingScreen message={phaseMessages[phase]} />
      </div>
    );
  }

  if (phase === 'error' || (phase === 'cancelled' && !response)) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-muted/5 text-center p-4">
        <div className="space-y-2">
          <p className="text-destructive font-medium">
            {phase === 'cancelled' ? 'Request Cancelled' : 'Request Failed'}
          </p>
          {error && <p className="text-sm text-muted-foreground">{error}</p>}
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-muted/5 text-muted-foreground gap-2 select-none">
        <div className="opacity-20 grayscale">
          <YasumuLogo width={64} height={64} />
        </div>
        <p className="text-sm">Send a request to see the response</p>
      </div>
    );
  }

  const headersCount = Object.keys(response.headers).length;
  const cookiesCount = response.cookies.length;

  return (
    <div className="flex flex-col h-full bg-background">
      <ResponseStatusBar response={response} />
      <Tabs defaultValue="body" className="flex flex-col flex-1 min-h-0">
        <div className="px-1 border-b flex-shrink-0">
          <TabsList className="bg-transparent h-10 w-full justify-start gap-2 p-0 rounded-none">
            <TabsTrigger
              value="body"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
            >
              Body
            </TabsTrigger>
            <TabsTrigger
              value="headers"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
            >
              Headers
              <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                {headersCount}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="cookies"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
            >
              Cookies
              <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                {cookiesCount}
              </span>
            </TabsTrigger>
            {scriptOutput.length > 0 && (
              <TabsTrigger
                value="console"
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
              >
                Console
                <span className="ml-2 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {scriptOutput.length}
                </span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>
        <TabsContent value="body" className="flex-1 min-h-0 m-0 p-0">
          <BodyView body={response.body} headers={response.headers} />
        </TabsContent>
        <TabsContent
          value="headers"
          className="flex-1 min-h-0 m-0 overflow-auto"
        >
          <HeadersView headers={response.headers} />
        </TabsContent>
        <TabsContent
          value="cookies"
          className="flex-1 min-h-0 m-0 overflow-auto"
        >
          <CookiesView cookies={response.cookies} />
        </TabsContent>
        {scriptOutput.length > 0 && (
          <TabsContent value="console" className="flex-1 min-h-0 m-0">
            <ConsoleView output={scriptOutput} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
