'use client';
// @ts-nocheck TODO: fix ts errors and remove this line
import { restQueries } from '@/app/[locale]/workspaces/[workspace]/rest/_constant/rest-queries-options';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import KeyValueTable, {
  KeyValuePair,
} from '@/components/tables/key-value-table';
import LoadingScreen from '@/components/visuals/loading-screen';
import YasumuBackgroundArt from '@/components/visuals/yasumu-background-art';
import useDebounced from '@/hooks/use-debounced';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetch } from '@tauri-apps/plugin-http';
import { Button } from '@yasumu/ui/components/button';
import { Input } from '@yasumu/ui/components/input';
import { Separator } from '@yasumu/ui/components/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import { Textarea } from '@yasumu/ui/components/textarea';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import HttpMethodSelector from './_components/http-methods-selector';
import { useRestContext } from './_providers/rest-context';
import { useRestOutput } from './_providers/rest-output';
import { RestEntityUpdateOptions } from '@yasumu/core';

export default function Home() {
  const { entityId } = useRestContext();
  const workspace = useActiveWorkspace();
  const { setOutput, setIsLoading } = useRestOutput();
  const queryClient = useQueryClient();
  const { isFetching, data } = useQuery(
    restQueries.getEntityOptions(entityId, workspace),
  );
  const method = data?.method || 'GET';
  const url = data?.data.url || '';

  async function updateCache(newData: Partial<RestEntityUpdateOptions>) {
    if (!entityId) return;
    await queryClient.cancelQueries(
      restQueries.getEntityOptions(entityId, workspace),
    );

    await queryClient.setQueryData(
      restQueries.getEntityOptions(entityId, workspace).queryKey,
      (oldData) => {
        if (!oldData) return oldData;

        return { ...oldData, data: { ...oldData.data, ...newData } };
      },
    );
  }

  const mutation = useMutation({
    mutationFn: (data: Partial<RestEntityUpdateOptions>) =>
      workspace.rest.update(entityId!, data),
  });
  const debounceMutate = useDebounced(mutation.mutate, 200);

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
    if (!entityId) return;
    updateCache({ method });
    mutation.mutate({ method });
  };

  const debouncedUpdateRequestUrl = useDebounced(async (url: string) => {
    if (!entityId) return;
    await workspace.rest.update(entityId, { url });
  }, 200);

  const setRequestUrl = async (url: string) => {
    updateCache({ url });
    await debounceMutate({ url });
  };

  const handleURLInputBlur = async () => {
    const searchParamsString = new URL(url).search;
    if (!searchParamsString) return;

    const searchParams = new URLSearchParams(searchParamsString);
    const requestParameters = Array.from(searchParams.entries()).map(
      ([key, value]) => ({
        key,
        value,
        enabled: true,
      }),
    );

    await updateCache({ requestParameters });
  };

  function handleRequestParametersChange(pairs: Array<KeyValuePair>) {
    const searchParams = new URLSearchParams();
    pairs.forEach((pair) => {
      if (pair.enabled && pair.key && pair.value) {
        searchParams.append(pair.key, pair.value);
      }
    });

    const urlObj = new URL(url);
    urlObj.search = searchParams.toString();
    const newUrl = urlObj.toString();
    updateCache({ url: newUrl, requestParameters: pairs }); // Optimistic update
    debounceMutate({ url: newUrl, requestParameters: pairs }); // Debounced server update
  }

  function handleRequestHeadersChange(pairs: Array<KeyValuePair>) {
    updateCache({ requestHeaders: pairs });
    mutation.mutate({ requestHeaders: pairs });
  }

  if (!entityId) {
    return (
      <main className="w-full h-screen relative grid place-items-center">
        <YasumuBackgroundArt message={'Yasumu'} />
      </main>
    );
  }

  if (isFetching) {
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
          onBlur={handleURLInputBlur}
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
          <KeyValueTable
            pairs={data?.data.requestParameters || []}
            onChange={handleRequestParametersChange}
          />
        </TabsContent>
        <TabsContent value="headers">
          <KeyValueTable
            pairs={data?.data.requestHeaders || []}
            onChange={handleRequestHeadersChange}
          />
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
