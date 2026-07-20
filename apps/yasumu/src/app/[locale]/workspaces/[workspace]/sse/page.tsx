'use client';

import type { RestEntityRequestBody, TabularPair, YasumuEmbeddedScript } from '@yasumu/core';
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

import { SseRequestTabs } from './_components/request-editor/sse-request-tabs';
import { SseUrlBar } from './_components/request-editor/sse-url-bar';
import { SseResponsePanel } from './_components/response-panel';
import RequestTabList from './_components/tabs';
import { useSseEntity } from './_hooks/use-sse-entity';
import { useSseRequest } from './_hooks/use-sse-request';
import { useSseContext } from './_providers/sse-context';

export default function SsePage() {
  const { entityId } = useSseContext();
  const { layout } = useAppLayout();
  const { renderVariablePopover } = useVariablePopover();
  const { data, isLoading, error, saveError, isSaving, updateField, save } = useSseEntity({ entityId });
  const { state, execute, cancel, clearEvents } = useSseRequest({ entityId });
  const pathParams = useMemo(() => tabularPairsToRecord(data?.requestParameters), [data?.requestParameters]);
  const active =
    state.phase === 'pre-request-script' || state.phase === 'sending' || state.phase === 'post-response-script';

  const connect = useCallback(async () => {
    if (!data) return;
    await save();
    await execute(data, pathParams);
  }, [data, execute, pathParams, save]);
  const connectSafely = useMemo(() => withErrorHandler(connect), [connect]);

  useHotkeys('mod+enter', () => void connectSafely(), { preventDefault: true, enableOnFormTags: false });

  if (!entityId) {
    return (
      <main className="relative grid h-full min-h-0 w-full place-items-center">
        <YasumuBackgroundArt message="SSE" />
      </main>
    );
  }
  if (error) return <ErrorScreen fullScreen title="Failed to load SSE stream" message={error.message} />;
  if (isLoading || !data) return <LoadingScreen fullScreen />;

  const requestEditor = (
    <SseRequestTabs
      key={entityId}
      url={data.url ?? ''}
      searchParams={data.searchParameters ?? []}
      pathParams={pathParams}
      headers={data.requestHeaders ?? []}
      body={data.requestBody}
      eventTypes={data.eventTypes ?? []}
      reconnect={data.reconnect}
      script={data.script}
      testScript={data.testScript}
      onSearchParamsChange={(value: TabularPair[]) => updateField('searchParameters', value)}
      onPathParamsChange={(value: ToggleableValueRecord) =>
        updateField('requestParameters', recordToTabularPairs(value))
      }
      onHeadersChange={(value: TabularPair[]) => updateField('requestHeaders', value)}
      onBodyChange={(value: RestEntityRequestBody | null) => updateField('requestBody', value)}
      onEventTypesChange={(value: string[]) => updateField('eventTypes', value)}
      onReconnectChange={(value) => updateField('reconnect', value)}
      onScriptChange={(value: YasumuEmbeddedScript) => updateField('script', value)}
      onTestScriptChange={(value: YasumuEmbeddedScript | null) => updateField('testScript', value)}
    />
  );

  return (
    <main className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-4 p-4">
        <RequestTabList />
        <SseUrlBar
          method={data.method}
          url={data.url ?? ''}
          connected={state.connected}
          active={active}
          isSaving={isSaving}
          onMethodChange={(method) => updateField('method', method)}
          onUrlChange={(url) => updateField('url', url)}
          onConnect={connectSafely}
          onDisconnect={cancel}
          onVariableClick={renderVariablePopover}
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
      <ResizablePanelGroup
        direction={layout === YasumuLayout.Classic ? 'vertical' : 'horizontal'}
        className="min-h-0 flex-1"
      >
        <ResizablePanel defaultSize={50} minSize={20}>
          {requestEditor}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={20}>
          <SseResponsePanel
            phase={state.phase}
            connected={state.connected}
            response={state.response}
            events={state.events}
            error={state.error}
            scriptOutput={state.scriptOutput}
            testResults={state.testResults}
            onClearEvents={clearEvents}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
