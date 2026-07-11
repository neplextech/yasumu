'use client';

import type { TestResult } from '@yasumu/core';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@yasumu/ui/components/tabs';
import { useQueryState, parseAsStringEnum } from 'nuqs';
import { useEffect } from 'react';

import LoadingScreen from '@/components/visuals/loading-screen';
import YasumuLogo from '@/components/visuals/yasumu-logo';

import type { RequestPhase, ScriptOutputEntry } from '../../_hooks/use-graphql-request';
import type { GraphqlResponse } from '../../_lib/graphql-request';
import { ConsoleView } from './console-view';
import { DataView } from './data-view';
import { ErrorsView } from './errors-view';
import { HeadersView } from './headers-view';
import { RawView } from './raw-view';
import { GraphqlResponseStatusBar } from './response-status-bar';
import { TestView } from './test-view';

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

export function GraphqlResponsePanel({ phase, response, error, scriptOutput, testResults }: GraphqlResponsePanelProps) {
  const [activeTab, setActiveTab] = useQueryState(
    'responseView',
    parseAsStringEnum(['data', 'raw']).withDefault('data'),
  );

  const [subTab, setSubTab] = useQueryState(
    'responseDataView',
    parseAsStringEnum(['response', 'errors', 'headers', 'console', 'tests']).withDefault('response'),
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

  if (phase === 'pre-request-script' || phase === 'sending' || phase === 'post-response-script') {
    return (
      <div className="bg-background/50 flex h-full flex-col items-center justify-center">
        <LoadingScreen message={phaseMessages[phase]} />
      </div>
    );
  }

  if (phase === 'error' || (phase === 'cancelled' && !response)) {
    return (
      <div className="bg-muted/5 flex h-full flex-col items-center justify-center p-4 text-center">
        <div className="space-y-2">
          <p className="text-destructive font-medium">
            {phase === 'cancelled' ? 'Request Cancelled' : 'Request Failed'}
          </p>
          {error && <p className="text-muted-foreground text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="bg-muted/5 text-muted-foreground flex h-full flex-col items-center justify-center gap-2 select-none">
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
    <div className="bg-background flex h-full flex-col">
      <GraphqlResponseStatusBar response={response} />
      <Tabs
        value={activeTab || 'data'}
        onValueChange={(v) => setActiveTab(v as 'data' | 'raw')}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="shrink-0 border-b px-1">
          <TabsList className="h-10 w-full justify-start gap-2 bg-transparent">
            <TabsTrigger value="data">Response</TabsTrigger>
            <TabsTrigger value="raw">Raw</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="data" className="min-h-0 flex-1">
          <Tabs
            value={subTab || 'response'}
            onValueChange={(v) => setSubTab(v as 'response' | 'errors' | 'headers' | 'console' | 'tests')}
            className="flex h-full flex-col"
          >
            <div className="shrink-0 border-b px-1">
              <TabsList className="w-full justify-start gap-1 bg-transparent">
                <TabsTrigger value="response">Data</TabsTrigger>
                {errorsCount > 0 && (
                  <TabsTrigger value="errors">
                    Errors
                    <span className="text-destructive bg-destructive/10 ml-1.5 rounded px-1 py-0.5 text-[10px]">
                      {errorsCount}
                    </span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="headers">
                  Headers
                  <span className="text-muted-foreground bg-background ml-1.5 rounded px-1 py-0.5 text-[10px]">
                    {headersCount}
                  </span>
                </TabsTrigger>
                {scriptOutput.length > 0 && (
                  <TabsTrigger value="console">
                    Console
                    <span className="text-muted-foreground bg-background ml-1.5 rounded px-1 py-0.5 text-[10px]">
                      {scriptOutput.length}
                    </span>
                  </TabsTrigger>
                )}
                {testResults.length > 0 && (
                  <TabsTrigger value="tests">
                    Tests
                    <span className="text-muted-foreground bg-background ml-1.5 rounded px-1 py-0.5 text-[10px]">
                      {testResults.length}
                    </span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
            <TabsContent value="response" className="min-h-0 flex-1">
              <DataView data={response.data} />
            </TabsContent>
            {errorsCount > 0 && (
              <TabsContent value="errors" className="min-h-0 flex-1">
                <ErrorsView errors={response.errors} />
              </TabsContent>
            )}
            <TabsContent value="headers" className="min-h-0 flex-1">
              <HeadersView headers={response.headers} />
            </TabsContent>
            {scriptOutput.length > 0 && (
              <TabsContent value="console" className="min-h-0 flex-1">
                <ConsoleView output={scriptOutput} />
              </TabsContent>
            )}
            {testResults.length > 0 && (
              <TabsContent value="tests" className="min-h-0 flex-1">
                <TestView results={testResults} />
              </TabsContent>
            )}
          </Tabs>
        </TabsContent>

        <TabsContent value="raw" className="min-h-0 flex-1">
          <RawView rawBody={response.rawBody} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
