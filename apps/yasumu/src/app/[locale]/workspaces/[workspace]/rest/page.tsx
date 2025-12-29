'use client';

import { useCallback, useMemo, useState } from 'react';
import { Separator } from '@yasumu/ui/components/separator';
import YasumuBackgroundArt from '@/components/visuals/yasumu-background-art';
import LoadingScreen from '@/components/visuals/loading-screen';
import { useRestContext } from './_providers/rest-context';
import { useRestEntity } from './_hooks/use-rest-entity';
import { useRestRequest } from './_hooks/use-rest-request';
import { RequestUrlBar } from './_components/request-editor/request-url-bar';
import { RestRequestTabs } from './_components/request-editor/rest-request-tabs';
import { RestResponsePanel } from './_components/response-panel';
import RequestTabList from './_components/tabs';
import type {
  TabularPair,
  RestEntityRequestBody,
  YasumuEmbeddedScript,
} from '@yasumu/common';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@yasumu/ui/components/resizable';

export default function RestPage() {
  const { entityId } = useRestContext();
  const { data, isLoading, error, isSaving, updateField, updateFields, save } =
    useRestEntity({ entityId });
  const { state: requestState, execute, cancel } = useRestRequest({ entityId });

  const [pathParams, setPathParams] = useState<
    Record<string, { value: string; enabled: boolean }>
  >({});

  const isRequestActive = useMemo(
    () =>
      requestState.phase === 'pre-request-script' ||
      requestState.phase === 'sending' ||
      requestState.phase === 'post-response-script',
    [requestState.phase],
  );

  const handleMethodChange = useCallback(
    (method: string) => {
      updateField('method', method as RestEntityRequestBody['type']);
    },
    [updateField],
  );

  const handleUrlChange = useCallback(
    (url: string) => {
      updateField('url', url);
    },
    [updateField],
  );

  const handleSend = useCallback(async () => {
    if (!data) return;
    await save();
    await execute(data, pathParams);
  }, [data, pathParams, save, execute]);

  const handleCancel = useCallback(() => {
    cancel();
  }, [cancel]);

  const handleSearchParamsChange = useCallback(
    (params: TabularPair[]) => {
      updateField('searchParameters', params);
    },
    [updateField],
  );

  const handlePathParamsChange = useCallback(
    (params: Record<string, { value: string; enabled: boolean }>) => {
      setPathParams(params);
      const tabularParams = Object.entries(params).map(([key, val]) => ({
        key,
        value: val.value,
        enabled: val.enabled,
      }));
      updateField('requestParameters', tabularParams);
    },
    [updateField],
  );

  const handleHeadersChange = useCallback(
    (headers: TabularPair[]) => {
      updateField('requestHeaders', headers);
    },
    [updateField],
  );

  const handleBodyChange = useCallback(
    (body: { type: string; data: unknown } | null) => {
      if (!body) {
        updateField('requestBody', null);
        return;
      }
      updateField('requestBody', {
        type: body.type as RestEntityRequestBody['type'],
        value: body.data,
        metadata: {},
      });
    },
    [updateField],
  );

  const handleScriptChange = useCallback(
    (script: YasumuEmbeddedScript) => {
      updateField('script', script);
    },
    [updateField],
  );

  const handleTestScriptChange = useCallback(
    (script: YasumuEmbeddedScript) => {
      updateField('testScript', script);
    },
    [updateField],
  );

  if (!entityId) {
    return (
      <main className="w-full h-screen relative grid place-items-center">
        <YasumuBackgroundArt message="Yasumu" />
      </main>
    );
  }

  if (isLoading || !data) {
    return <LoadingScreen fullScreen />;
  }

  if (error) {
    return (
      <main className="w-full h-screen relative grid place-items-center">
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">Failed to load entity</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full h-full flex flex-col overflow-hidden">
      <div className="p-4 space-y-4 flex-shrink-0">
        <RequestTabList />
        <RequestUrlBar
          method={data.method}
          url={data.url || ''}
          onMethodChange={handleMethodChange}
          onUrlChange={handleUrlChange}
          onSend={handleSend}
          onCancel={handleCancel}
          isSending={isRequestActive}
          isSaving={isSaving}
        />
      </div>
      <Separator />
      <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={50} minSize={20}>
          <RestRequestTabs
            key={entityId}
            searchParams={data.searchParameters || []}
            pathParams={pathParams}
            headers={data.requestHeaders || []}
            body={data.requestBody}
            script={data.script}
            testScript={data.testScript}
            url={data.url || ''}
            onSearchParamsChange={handleSearchParamsChange}
            onPathParamsChange={handlePathParamsChange}
            onHeadersChange={handleHeadersChange}
            onBodyChange={handleBodyChange}
            onScriptChange={handleScriptChange}
            onTestScriptChange={handleTestScriptChange}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={20}>
          <RestResponsePanel
            phase={requestState.phase}
            response={requestState.response}
            error={requestState.error}
            scriptOutput={requestState.scriptOutput}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
