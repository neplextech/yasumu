'use client';

import { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import LoadingScreen from '@/components/visuals/loading-screen';
import YasumuLogo from '@/components/visuals/yasumu-logo';
import type { RestResponse } from '../../_lib/rest-request';
import type { RequestPhase } from '../../_hooks/use-rest-request';
import { ResponseStatusBar } from './response-status-bar';
import { HeadersView } from './headers-view';
import { CookiesView } from './cookies-view';
import { BodyView } from './body-view';
import { PreviewView } from './preview-view';
import { ConsoleView } from './console-view';
import { TestView, type TestResultItem } from './test-view';
import type { ScriptOutputEntry } from '../../_hooks/use-rest-request';

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
  const [activeTab, setActiveTab] = useState<'response' | 'preview'>(
    'response',
  );

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
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'response' | 'preview')}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="px-1 flex-shrink-0 border-b">
          <TabsList className="bg-transparent h-10 w-full justify-start gap-2">
            <TabsTrigger value="response">Response</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="response" className="flex-1 min-h-0">
          <Tabs defaultValue="body" className="flex flex-col h-full">
            <div className="px-1 flex-shrink-0 border-b">
              <TabsList className="bg-transparent w-full justify-start gap-1">
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="headers">
                  Headers
                  <span className="ml-1.5 text-[10px] text-muted-foreground bg-background px-1 py-0.5 rounded">
                    {headersCount}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="cookies">
                  Cookies
                  <span className="ml-1.5 text-[10px] text-muted-foreground bg-background px-1 py-0.5 rounded">
                    {cookiesCount}
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
            <TabsContent value="body" className="flex-1 min-h-0">
              <BodyView response={response} />
            </TabsContent>
            <TabsContent value="headers" className="flex-1 min-h-0">
              <HeadersView headers={response.headers} />
            </TabsContent>
            <TabsContent value="cookies" className="flex-1 min-h-0">
              <CookiesView cookies={response.cookies} />
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

        <TabsContent value="preview" className="flex-1 min-h-0">
          <PreviewView response={response} blobUrl={blobUrl} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
