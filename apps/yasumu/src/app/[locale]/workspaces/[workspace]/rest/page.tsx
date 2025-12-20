'use client';
import { Input } from '@yasumu/ui/components/input';
import HttpMethodSelector from './_components/http-methods-selector';
import KeyValueTable from '@/components/tables/key-value-table';
import { Separator } from '@yasumu/ui/components/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import { Textarea } from '@yasumu/ui/components/textarea';
import { useRestContext } from './_providers/rest-context';
import YasumuBackgroundArt from '@/components/visuals/yasumu-background-art';
import { HttpMethods } from '@yasumu/core';
import { useEffect, useEffectEvent, useState } from 'react';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import useDebounced from '@/hooks/use-debounced';
import { useRestOutput } from './_providers/rest-output';
import { fetch } from '@tauri-apps/plugin-http';
import { Button } from '@yasumu/ui/components/button';
import LoadingScreen from '@/components/visuals/loading-screen';

export default function Home() {
  const { entityId } = useRestContext();
  const workspace = useActiveWorkspace();
  const [method, setMethod] = useState<string>(HttpMethods.Get);
  const [url, setUrl] = useState<string>('');
  const { setOutput, setIsLoading } = useRestOutput();
  const [loading, setLoading] = useState<boolean>(true);

  const fetchEntity = useEffectEvent(async () => {
    if (!entityId) return;

    setLoading(true);
    const entity = await workspace.rest.get(entityId);
    console.log(entity);
    setMethod(entity.method);
    setUrl(entity.getFullURL() ?? '');
    setLoading(false);
  });

  const sendRequest = async () => {
    try {
      setIsLoading(true);
      const start = performance.now();
      const response = await fetch(url, {
        method,
      });
      const end = performance.now();
      const time = end - start;

      const raw = await response.text();
      const headers = Object.fromEntries(response.headers.entries());

      setOutput({
        status: response.status,
        statusText: response.statusText,
        time,
        headers,
        body: raw,
        raw: `Time: ${time}ms\nStatus: ${response.status} ${response.statusText}\n${Object.entries(
          headers,
        )
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n')}\n\nBody:\n${raw}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setHttpMethod = async (method: string) => {
    setMethod(method);
    if (!entityId) return;
    await workspace.rest.update(entityId, { method });
  };

  const debouncedUpdateRequestUrl = useDebounced(async (url: string) => {
    if (!entityId) return;
    await workspace.rest.update(entityId, { url });
  }, 200);

  const setRequestUrl = async (url: string) => {
    setUrl(url);
    await debouncedUpdateRequestUrl(url);
  };

  useEffect(() => {
    void fetchEntity();
  }, [entityId]);

  if (!entityId) {
    return (
      <main className="w-full h-screen relative grid place-items-center">
        <YasumuBackgroundArt message={'Yasumu'} />
      </main>
    );
  }

  if (loading) {
    return <LoadingScreen fullScreen />;
  }

  return (
    <main className="p-4 w-full h-full overflow-y-auto flex flex-col gap-4">
      {/* <RequestTabList /> */}
      <div className="flex gap-4">
        <HttpMethodSelector
          onChange={withErrorHandler(setHttpMethod)}
          value={method}
        />
        <Input
          placeholder="Enter a URL"
          value={url}
          onChange={withErrorHandler((e) => setRequestUrl(e.target.value))}
        />
        <Button onClick={withErrorHandler(sendRequest)}>Send</Button>
      </div>
      <Separator />
      <Tabs defaultValue="parameters">
        <TabsList>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="pre-request-script">
            Pre-request Script
          </TabsTrigger>
          <TabsTrigger value="post-response-script">
            Post-response Script
          </TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="parameters">
          <KeyValueTable />
        </TabsContent>
        <TabsContent value="headers">
          <KeyValueTable />
        </TabsContent>
        <TabsContent value="body">
          <Textarea placeholder="Your request body goes here..." />
        </TabsContent>
        <TabsContent value="pre-request-script">
          <Textarea placeholder="Your pre-request script goes here..." />
        </TabsContent>
        <TabsContent value="post-response-script">
          <Textarea placeholder="Your post-response script goes here..." />
        </TabsContent>
        <TabsContent value="tests">
          <Textarea placeholder="Your test script goes here..." />
        </TabsContent>
        <TabsContent value="settings">Settings Editor</TabsContent>
      </Tabs>
    </main>
  );
}
