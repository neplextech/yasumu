'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@yasumu/ui/components/tabs';
import { useState } from 'react';

import LoadingScreen from '@/components/visuals/loading-screen';
import YasumuLogo from '@/components/visuals/yasumu-logo';

import type { RequestPhase } from '../../_hooks/use-rest-request';
import type { ScriptOutputEntry } from '../../_hooks/use-rest-request';
import type { RestResponse } from '../../_lib/rest-request';
import { BodyView } from './body-view';
import { ConsoleView } from './console-view';
import { CookiesView } from './cookies-view';
import { HeadersView } from './headers-view';
import { PreviewView } from './preview-view';
import { ResponseStatusBar } from './response-status-bar';
import { TestView, type TestResultItem } from './test-view';

interface RestResponsePanelProps {
  phase: RequestPhase;
  response: RestResponse | null;
  error: string | null;
  scriptOutput: ScriptOutputEntry[];
  blobUrl: string | null;
  testResults: TestResultItem[];
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

export function RestResponsePanel({
  phase,
  response,
  error,
  scriptOutput,
  blobUrl,
  testResults,
}: RestResponsePanelProps) {
  const [activeTab, setActiveTab] = useState<'response' | 'preview'>('response');

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
  const cookiesCount = response.cookies.length;

  return (
    <div className="bg-background flex h-full flex-col">
      <ResponseStatusBar response={response} />
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'response' | 'preview')}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex-shrink-0 border-b px-1">
          <TabsList className="h-10 w-full justify-start gap-2 bg-transparent">
            <TabsTrigger value="response">Response</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="response" className="min-h-0 flex-1">
          <Tabs defaultValue="body" className="flex h-full flex-col">
            <div className="flex-shrink-0 border-b px-1">
              <TabsList className="w-full justify-start gap-1 bg-transparent">
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="headers">
                  Headers
                  <span className="text-muted-foreground bg-background ml-1.5 rounded px-1 py-0.5 text-[10px]">
                    {headersCount}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="cookies">
                  Cookies
                  <span className="text-muted-foreground bg-background ml-1.5 rounded px-1 py-0.5 text-[10px]">
                    {cookiesCount}
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
            <TabsContent value="body" className="min-h-0 flex-1">
              <BodyView response={response} onSwitchToPreview={() => setActiveTab('preview')} />
            </TabsContent>
            <TabsContent value="headers" className="min-h-0 flex-1">
              <HeadersView headers={response.headers} />
            </TabsContent>
            <TabsContent value="cookies" className="min-h-0 flex-1">
              <CookiesView cookies={response.cookies} />
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

        <TabsContent value="preview" className="min-h-0 flex-1">
          <PreviewView response={response} blobUrl={blobUrl} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
