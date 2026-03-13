'use client';

import { useQueryState, parseAsStringEnum } from 'nuqs';
import { useEffect } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import LoadingScreen from '@/components/visuals/loading-screen';
import YasumuLogo from '@/components/visuals/yasumu-logo';
import type { GraphqlResponse } from '../../_lib/graphql-request';
import type {
  RequestPhase,
  ScriptOutputEntry,
} from '../../_hooks/use-graphql-request';
import { GraphqlResponseStatusBar } from './response-status-bar';
import { HeadersView } from './headers-view';
import { DataView } from './data-view';
import { ErrorsView } from './errors-view';
import { RawView } from './raw-view';
import { ConsoleView } from './console-view';
import { TestView } from './test-view';
import type { TestResult } from '@yasumu/core';

interface GraphqlResponsePanelProps {
  phase: RequestPhase;
  response: GraphqlResponse | null;
  error: string | null;
  scriptOutput: ScriptOutputEntry[];
  testResults: TestResult[];
}

const phaseMessages: Record<RequestPhase, string> = {
  idle: '',
  'pre-request-script': 'Running pre-request script...',
  sending: 'Sending request...',
  'post-response-script': 'Running post-response script...',
  completed: '',
  error: '',
  cancelled: '',
};

export function GraphqlResponsePanel({
  phase,
  response,
  error,
  scriptOutput,
  testResults,
}: GraphqlResponsePanelProps) {
  const [activeTab, setActiveTab] = useQueryState(
    'responseView',
    parseAsStringEnum(['data', 'raw']).withDefault('data'),
  );

  const [subTab, setSubTab] = useQueryState(
    'responseDataView',
    parseAsStringEnum([
      'response',
      'errors',
      'headers',
      'console',
      'tests',
    ]).withDefault('response'),
  );

  // Auto-focus logic
  useEffect(() => {
    if (!response) return;

    if (response.errors && response.errors.length > 0) {
      setActiveTab('data');
      setSubTab('errors');
    } else {
      setActiveTab('data');
      setSubTab('response');
    }
  }, [response, setActiveTab, setSubTab]);

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
  const errorsCount = response.errors?.length ?? 0;

  return (
    <div className="flex flex-col h-full bg-background">
      <GraphqlResponseStatusBar response={response} />
      <Tabs
        value={activeTab || 'data'}
        onValueChange={(v) => setActiveTab(v as 'data' | 'raw')}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="px-1 shrink-0 border-b">
          <TabsList className="bg-transparent h-10 w-full justify-start gap-2">
            <TabsTrigger value="data">Response</TabsTrigger>
            <TabsTrigger value="raw">Raw</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="data" className="flex-1 min-h-0">
          <Tabs
            value={subTab || 'response'}
            onValueChange={(v) =>
              setSubTab(
                v as 'response' | 'errors' | 'headers' | 'console' | 'tests',
              )
            }
            className="flex flex-col h-full"
          >
            <div className="px-1 shrink-0 border-b">
              <TabsList className="bg-transparent w-full justify-start gap-1">
                <TabsTrigger value="response">Data</TabsTrigger>
                {errorsCount > 0 && (
                  <TabsTrigger value="errors">
                    Errors
                    <span className="ml-1.5 text-[10px] text-destructive bg-destructive/10 px-1 py-0.5 rounded">
                      {errorsCount}
                    </span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="headers">
                  Headers
                  <span className="ml-1.5 text-[10px] text-muted-foreground bg-background px-1 py-0.5 rounded">
                    {headersCount}
                  </span>
                </TabsTrigger>
                {scriptOutput.length > 0 && (
                  <TabsTrigger value="console">
                    Console
                    <span className="ml-1.5 text-[10px] text-muted-foreground bg-background px-1 py-0.5 rounded">
                      {scriptOutput.length}
                    </span>
                  </TabsTrigger>
                )}
                {testResults.length > 0 && (
                  <TabsTrigger value="tests">
                    Tests
                    <span className="ml-1.5 text-[10px] text-muted-foreground bg-background px-1 py-0.5 rounded">
                      {testResults.length}
                    </span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
            <TabsContent value="response" className="flex-1 min-h-0">
              <DataView data={response.data} />
            </TabsContent>
            {errorsCount > 0 && (
              <TabsContent value="errors" className="flex-1 min-h-0">
                <ErrorsView errors={response.errors} />
              </TabsContent>
            )}
            <TabsContent value="headers" className="flex-1 min-h-0">
              <HeadersView headers={response.headers} />
            </TabsContent>
            {scriptOutput.length > 0 && (
              <TabsContent value="console" className="flex-1 min-h-0">
                <ConsoleView output={scriptOutput} />
              </TabsContent>
            )}
            {testResults.length > 0 && (
              <TabsContent value="tests" className="flex-1 min-h-0">
                <TestView results={testResults} />
              </TabsContent>
            )}
          </Tabs>
        </TabsContent>

        <TabsContent value="raw" className="flex-1 min-h-0">
          <RawView rawBody={response.rawBody} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
