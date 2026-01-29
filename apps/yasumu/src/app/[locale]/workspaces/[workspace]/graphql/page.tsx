'use client';

import { useCallback, useMemo } from 'react';
import { Separator } from '@yasumu/ui/components/separator';
import YasumuBackgroundArt from '@/components/visuals/yasumu-background-art';
import LoadingScreen from '@/components/visuals/loading-screen';
import { useGraphqlContext } from './_providers/graphql-context';
import { useGraphqlEntity } from './_hooks/use-graphql-entity';
import { useGraphqlRequest } from './_hooks/use-graphql-request';
import { GraphqlUrlBar } from './_components/request-editor/graphql-url-bar';
import { GraphqlRequestTabs } from './_components/request-editor/graphql-request-tabs';
import { GraphqlResponsePanel } from './_components/response-panel';
import RequestTabList from './_components/tabs';
import { useAppLayout } from '@/components/providers/app-layout-provider';
import { YasumuLayout } from '@/lib/constants/layout';
import { useVariablePopover } from '@/components/inputs';
import type { TabularPair, YasumuEmbeddedScript } from '@yasumu/common';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@yasumu/ui/components/resizable';
import { useHotkeys } from 'react-hotkeys-hook';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';

export default function GraphqlPage() {
  const { entityId } = useGraphqlContext();
  const { layout } = useAppLayout();
  const { renderVariablePopover } = useVariablePopover();
  const { data, isLoading, error, isSaving, updateField, save } =
    useGraphqlEntity({
      entityId,
    });
  const {
    state: requestState,
    execute,
    cancel,
  } = useGraphqlRequest({ entityId });

  const isRequestActive = useMemo(
    () =>
      requestState.phase === 'pre-request-script' ||
      requestState.phase === 'sending' ||
      requestState.phase === 'post-response-script',
    [requestState.phase],
  );

  const isClassicLayout = layout === YasumuLayout.Classic;

  const handleUrlChange = useCallback(
    (url: string) => {
      updateField('url', url);
    },
    [updateField],
  );

  const handleQueryChange = useCallback(
    (query: string) => {
      updateField('query', query);
    },
    [updateField],
  );

  const handleVariablesChange = useCallback(
    (variables: string) => {
      updateField('variables', variables);
    },
    [updateField],
  );

  const handleHeadersChange = useCallback(
    (headers: TabularPair[]) => {
      updateField('requestHeaders', headers);
    },
    [updateField],
  );

  const handleScriptChange = useCallback(
    (script: YasumuEmbeddedScript) => {
      updateField('script', script);
    },
    [updateField],
  );

  const handleSend = useCallback(async () => {
    if (!data) return;
    await save();
    await execute(data);
  }, [data, save, execute]);

  const handleCancel = useCallback(() => {
    cancel();
  }, [cancel]);

  useHotkeys(
    'mod+enter',
    async () => {
      await withErrorHandler(handleSend)();
    },
    { preventDefault: true, enableOnFormTags: false },
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

  const requestEditor = (
    <GraphqlRequestTabs
      key={entityId}
      query={data.query || ''}
      variables={data.variables || ''}
      headers={data.requestHeaders || []}
      script={data.script}
      onQueryChange={handleQueryChange}
      onVariablesChange={handleVariablesChange}
      onHeadersChange={handleHeadersChange}
      onScriptChange={handleScriptChange}
    />
  );

  const responsePanel = (
    <GraphqlResponsePanel
      phase={requestState.phase}
      response={requestState.response}
      error={requestState.error}
      scriptOutput={requestState.scriptOutput}
      testResults={requestState.testResults}
    />
  );

  return (
    <main className="w-full h-full flex flex-col overflow-hidden">
      <div className="p-4 space-y-4 shrink-0">
        <RequestTabList />
        <GraphqlUrlBar
          url={data.url || ''}
          onUrlChange={handleUrlChange}
          onSend={handleSend}
          onCancel={handleCancel}
          onVariableClick={renderVariablePopover}
          isSending={isRequestActive}
          isSaving={isSaving}
        />
      </div>
      <Separator />
      <ResizablePanelGroup
        direction={isClassicLayout ? 'vertical' : 'horizontal'}
        className="flex-1 min-h-0"
      >
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
