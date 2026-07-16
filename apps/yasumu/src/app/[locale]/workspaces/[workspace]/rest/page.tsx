'use client';

import type { TabularPair, RestEntityRequestBody, YasumuEmbeddedScript } from '@yasumu/core';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@yasumu/ui/components/resizable';
import { Separator } from '@yasumu/ui/components/separator';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { useCallback, useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import {
  recordToTabularPairs,
  tabularPairsToRecord,
  type ToggleableValueRecord,
} from '@/app/[locale]/workspaces/[workspace]/_lib/tabular-pairs';
import { useVariablePopover } from '@/components/inputs';
import { useAppLayout } from '@/components/providers/app-layout-provider';
import ErrorScreen from '@/components/visuals/error-screen';
import { InlineErrorBanner } from '@/components/visuals/inline-error-banner';
import LoadingScreen from '@/components/visuals/loading-screen';
import YasumuBackgroundArt from '@/components/visuals/yasumu-background-art';
import { YasumuLayout } from '@/lib/constants/layout';

import { RequestUrlBar } from './_components/request-editor/request-url-bar';
import { RestRequestTabs } from './_components/request-editor/rest-request-tabs';
import { RestResponsePanel } from './_components/response-panel';
import RequestTabList from './_components/tabs';
import { useRestEntity } from './_hooks/use-rest-entity';
import { useRestRequest } from './_hooks/use-rest-request';
import { useRestContext } from './_providers/rest-context';

export default function RestPage() {
  const { entityId } = useRestContext();
  const { layout } = useAppLayout();
  const { renderVariablePopover } = useVariablePopover();
  const { data, isLoading, error, saveError, isSaving, updateField, save } = useRestEntity({
    entityId,
  });
  const { state: requestState, execute, cancel } = useRestRequest({ entityId });

  const pathParams = useMemo(() => tabularPairsToRecord(data?.requestParameters), [data?.requestParameters]);
  const isRequestActive =
    requestState.phase === 'pre-request-script' ||
    requestState.phase === 'sending' ||
    requestState.phase === 'post-response-script';

  const isClassicLayout = layout === YasumuLayout.Classic;

  const handleMethodChange = useCallback(
    (method: string) => {
      updateField('method', method);
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
  const handleSendSafely = useMemo(() => withErrorHandler(handleSend), [handleSend]);

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
    (params: ToggleableValueRecord) => {
      updateField('requestParameters', recordToTabularPairs(params));
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
    (body: RestEntityRequestBody | null) => updateField('requestBody', body),
    [updateField],
  );

  const handleScriptChange = useCallback(
    (script: YasumuEmbeddedScript) => {
      updateField('script', script);
    },
    [updateField],
  );

  useHotkeys('mod+enter', () => void handleSendSafely(), { preventDefault: true, enableOnFormTags: false });

  if (!entityId) {
    return (
      <main className="relative grid h-full min-h-0 w-full place-items-center">
        <YasumuBackgroundArt message="Yasumu" />
      </main>
    );
  }

  if (error) {
    return <ErrorScreen fullScreen title="Failed to load entity" message={error.message} />;
  }

  if (isLoading || !data) {
    return <LoadingScreen fullScreen />;
  }

  const requestEditor = (
    <RestRequestTabs
      key={entityId}
      searchParams={data.searchParameters || []}
      pathParams={pathParams}
      headers={data.requestHeaders || []}
      body={data.requestBody}
      script={data.script}
      url={data.url || ''}
      onSearchParamsChange={handleSearchParamsChange}
      onPathParamsChange={handlePathParamsChange}
      onHeadersChange={handleHeadersChange}
      onBodyChange={handleBodyChange}
      onScriptChange={handleScriptChange}
    />
  );

  const responsePanel = (
    <RestResponsePanel
      phase={requestState.phase}
      response={requestState.response}
      error={requestState.error}
      scriptOutput={requestState.scriptOutput}
      blobUrl={requestState.blobUrl}
      testResults={requestState.testResults}
    />
  );

  return (
    <main className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex-shrink-0 space-y-4 p-4">
        <RequestTabList />
        <RequestUrlBar
          method={data.method}
          url={data.url || ''}
          onMethodChange={handleMethodChange}
          onUrlChange={handleUrlChange}
          onSend={handleSendSafely}
          onCancel={handleCancel}
          onVariableClick={renderVariablePopover}
          isSending={isRequestActive}
          isSaving={isSaving}
        />
      </div>
      {saveError ? (
        <InlineErrorBanner
          message={`Changes are not saved: ${saveError.message}`}
          actionLabel="Retry save"
          actionDisabled={isSaving}
          onAction={() => void withErrorHandler(save)()}
        />
      ) : null}
      <Separator />
      <ResizablePanelGroup direction={isClassicLayout ? 'vertical' : 'horizontal'} className="min-h-0 flex-1">
        <ResizablePanel defaultSize={50} minSize={20}>
          {requestEditor}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={20}>
          {responsePanel}
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
