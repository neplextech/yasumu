// @ts-nocheck TODO: fix ts errors and remove this line
// TODO: rewrite this page with better/robust architecture.
// Current implementation is a mess as it was built quickly and without a proper plan for a prototype
'use client';
import { restQueries } from '@/app/[locale]/workspaces/[workspace]/rest/_constant/rest-queries-options';
import {
  useActiveWorkspace,
  useYasumu,
} from '@/components/providers/workspace-provider';
import { FormDataPair } from '@/components/tables/form-data-table';
import { KeyValuePair } from '@/components/tables/key-value-table';
import LoadingScreen from '@/components/visuals/loading-screen';
import YasumuBackgroundArt from '@/components/visuals/yasumu-background-art';
import useDebounced from '@/hooks/use-debounced';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetch } from '@tauri-apps/plugin-http';
import { Separator } from '@yasumu/ui/components/separator';
import { useRestContext } from './_providers/rest-context';
import { useRestOutput } from './_providers/rest-output';
import { RestEntityUpdateOptions } from '@yasumu/core';
import { RequestUrlBar } from './_components/request-editor/request-url-bar';
import { RestRequestTabs } from './_components/request-editor/rest-request-tabs';
import RequestTabList from './_components/tabs';
import { useState } from 'react';
import { useEnvironmentStore } from '../../_stores/environment-store';

const ECHO_SERVER_DOMAIN = 'echo.yasumu.local';

export default function Home() {
  const { entityId } = useRestContext();
  const { echoServerPort } = useYasumu();
  const workspace = useActiveWorkspace();
  const { setOutput, setIsLoading, isLoading } = useRestOutput();
  const queryClient = useQueryClient();
  const { isFetching, data } = useQuery(
    restQueries.getEntityOptions(entityId, workspace),
  );
  const { interpolate } = useEnvironmentStore();
  const method = data?.data.method || 'GET';
  const url = data?.data.url || '';

  const [pathParams, setPathParams] = useState<
    Record<string, { value: string; enabled: boolean }>
  >({});

  async function updateCache(newData: Partial<RestEntityUpdateOptions>) {
    if (!entityId) return;
    await queryClient.cancelQueries(
      restQueries.getEntityOptions(entityId, workspace),
    );

    await queryClient.setQueryData(
      restQueries.getEntityOptions(entityId, workspace).queryKey,
      // @ts-expect-error TODO: fix this
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

      const requestHeaders = new Headers({
        'user-agent': 'Yasumu/1.0',
      });
      if (data?.data.requestHeaders) {
        data.data.requestHeaders.forEach((h: any) => {
          if (h.enabled && h.key) {
            requestHeaders.append(interpolate(h.key), interpolate(h.value));
          }
        });
      }

      let body: any = undefined;
      if (data?.data.body) {
        const { type, data: bodyData } = data.data.body;

        if (type === 'json' || type === 'text') {
          body = bodyData;
          if (type === 'json' && !requestHeaders.has('Content-Type')) {
            requestHeaders.set('Content-Type', 'application/json');
          } else if (type === 'text' && !requestHeaders.has('Content-Type')) {
            requestHeaders.set('Content-Type', 'text/plain');
          }
        } else if (type === 'binary' && bodyData instanceof File) {
          body = bodyData;
          if (!requestHeaders.has('Content-Type')) {
            requestHeaders.set(
              'Content-Type',
              bodyData.type || 'application/octet-stream',
            );
          }
        } else if (type === 'form-data' && Array.isArray(bodyData)) {
          const formData = new FormData();
          bodyData.forEach((pair: FormDataPair) => {
            if (pair.enabled && pair.key) {
              formData.append(interpolate(pair.key), interpolate(pair.value));
            }
          });
          body = formData;
          // Let browser set Content-Type with boundary for FormData
          if (requestHeaders.has('Content-Type')) {
            requestHeaders.delete('Content-Type');
          }
        } else if (
          type === 'x-www-form-urlencoded' &&
          Array.isArray(bodyData)
        ) {
          const searchParams = new URLSearchParams();
          bodyData.forEach((pair: KeyValuePair) => {
            if (pair.enabled && pair.key) {
              searchParams.append(
                interpolate(pair.key),
                interpolate(pair.value),
              );
            }
          });
          body = searchParams;
          if (!requestHeaders.has('Content-Type')) {
            requestHeaders.set(
              'Content-Type',
              'application/x-www-form-urlencoded',
            );
          }
        }
      }

      let finalUrl = interpolate(url);

      if (echoServerPort) {
        try {
          const urlObj = new URL(finalUrl);

          console.log({ urlObj });

          if (urlObj.hostname === ECHO_SERVER_DOMAIN) {
            urlObj.protocol = 'http';
            urlObj.port = echoServerPort.toString();
            urlObj.hostname = 'localhost';
            finalUrl = urlObj.toString();
          }
        } catch {}
      }

      const paramRegex = /:([a-zA-Z0-9_]+)/g;
      finalUrl = finalUrl.replace(paramRegex, (match, key) => {
        const param = pathParams[key];
        if (param && param.enabled) {
          return interpolate(param.value);
        }
        return match;
      });

      const response = await fetch(finalUrl, {
        method,
        headers: requestHeaders,
        body,
      });
      const end = performance.now();
      const time = end - start;

      const raw = await response.text();
      const headers = Object.fromEntries(response.headers.entries());

      // Try to get cookies safely.
      // Note: standard fetch API often hides Set-Cookie, but Tauri's plugin might expose it or we might need a workaround.
      // If getSetCookie is available (modern standard), use it.
      let cookies: string[] = [];
      if (
        'getSetCookie' in response.headers &&
        typeof response.headers.getSetCookie === 'function'
      ) {
        // @ts-ignore
        cookies = response.headers.getSetCookie();
      } else {
        // Fallback or check if 'set-cookie' is in entries (it might be comma separated which is bad for dates)
        // But for now let's rely on what we can get.
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
          // Basic splitting by comma if it looks like multiple cookies,
          // but strictly splitting by comma breaks dates.
          // A proper parser handles this, but here we just get the raw string.
          // For display purposes, we might just put it in an array if it's a single string.
          // Or try to split smart.
          // Let's just wrap it for now if getSetCookie isn't there.
          cookies = [setCookie];
        }
      }

      setOutput({
        status: response.status,
        statusText: response.statusText,
        time,
        headers,
        cookies,
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

    const urlObj = new URL(interpolate(url));
    urlObj.search = searchParams.toString();
    const newUrl = urlObj.toString();
    updateCache({ url: newUrl }); // Optimistic update
    debounceMutate({ url: newUrl }); // Debounced server update
  }

  function handleRequestHeadersChange(pairs: Array<KeyValuePair>) {
    updateCache({ requestHeaders: pairs });
    mutation.mutate({ requestHeaders: pairs });
  }

  function handleBodyChange(body: { type: string; data: any } | null) {
    updateCache({ body });
    if (body?.type !== 'binary') {
      // Was file, now binary. Don't sync binary file data to server (usually too big/not serializable simply)
      mutation.mutate({ body });
    }
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
      <RequestTabList />
      <RequestUrlBar
        method={method}
        url={url}
        onMethodChange={setHttpMethod}
        onUrlChange={setRequestUrl}
        onUrlBlur={handleURLInputBlur}
        onSend={sendRequest}
        isSending={isLoading}
      />
      <Separator />
      <RestRequestTabs
        key={entityId}
        parameters={data?.data.requestParameters || []}
        headers={data?.data.requestHeaders || []}
        body={data?.data.body || null}
        url={url}
        pathParams={pathParams}
        onPathParamsChange={setPathParams}
        onParametersChange={handleRequestParametersChange}
        onHeadersChange={handleRequestHeadersChange}
        onBodyChange={handleBodyChange}
      />
    </main>
  );
}
