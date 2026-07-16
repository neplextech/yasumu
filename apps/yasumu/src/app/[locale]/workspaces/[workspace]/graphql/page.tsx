'use client';

import type { TabularPair, YasumuEmbeddedScript } from '@yasumu/core';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@yasumu/ui/components/resizable';
import { Separator } from '@yasumu/ui/components/separator';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { useCallback, useEffect, useMemo, useRef } from 'react';
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

import { GraphqlRequestTabs } from './_components/request-editor/graphql-request-tabs';
import { GraphqlUrlBar } from './_components/request-editor/graphql-url-bar';
import { GraphqlResponsePanel } from './_components/response-panel';
import RequestTabList from './_components/tabs';
import { useGraphqlEntity } from './_hooks/use-graphql-entity';
import { getGraphqlBodyValue } from './_hooks/use-graphql-entity';
import { useGraphqlIntrospection } from './_hooks/use-graphql-introspection';
import { useGraphqlRequest } from './_hooks/use-graphql-request';
import { useQueryBuilder } from './_hooks/use-query-builder';
import { useMonacoGraphqlLanguage } from './_lib/monaco-graphql-support';
import { useGraphqlContext } from './_providers/graphql-context';

export default function GraphqlPage() {
  const { entityId } = useGraphqlContext();
  const { layout } = useAppLayout();
  const { renderVariablePopover } = useVariablePopover();
  const { data, isLoading, error, saveError, isSaving, updateField, updateBodyValue, save } = useGraphqlEntity({
    entityId,
  });
  const { state: requestState, execute, cancel } = useGraphqlRequest({ entityId });

  const { schema, isLoading: isIntrospecting, error: introspectionError, introspect } = useGraphqlIntrospection();
  useMonacoGraphqlLanguage(schema);

  const {
    operations: queryBuilderOperations,
    activeOperation: queryBuilderActiveOperation,
    setActiveOperation: setQueryBuilderActiveOperation,
    currentOperation: queryBuilderCurrentOperation,
    toggleField: queryBuilderToggleField,
    toggleExpand: queryBuilderToggleExpand,
    setArgValue: queryBuilderSetArgValue,
    generatedQuery: queryBuilderGeneratedQuery,
  } = useQueryBuilder(schema);

  const pathParams = useMemo(() => tabularPairsToRecord(data?.requestParameters), [data?.requestParameters]);

  const isRequestActive =
    requestState.phase === 'pre-request-script' ||
    requestState.phase === 'sending' ||
    requestState.phase === 'post-response-script';

  const isClassicLayout = layout === YasumuLayout.Classic;

  const handleUrlChange = useCallback(
    (url: string) => {
      updateField('url', url);
    },
    [updateField],
  );

  const handleQueryChange = useCallback(
    (query: string) => {
      updateBodyValue({ query });
    },
    [updateBodyValue],
  );

  const handleVariablesChange = useCallback(
    (variables: string) => {
      updateBodyValue({ variables });
    },
    [updateBodyValue],
  );

  const handleHeadersChange = useCallback(
    (headers: TabularPair[]) => {
      updateField('requestHeaders', headers);
    },
    [updateField],
  );

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
  const handleSendSafely = useMemo(() => withErrorHandler(handleSend), [handleSend]);

  const handleCancel = useCallback(() => {
    cancel();
  }, [cancel]);

  const handleIntrospect = useCallback(async () => {
    if (!data?.url) return;
    const interpolatedHeaders = Object.fromEntries(
      (data.requestHeaders || []).filter((h) => h.enabled && h.key).map((h) => [h.key, h.value]),
    );
    await introspect(data.url, interpolatedHeaders);
  }, [data?.url, data?.requestHeaders, introspect]);

  const lastIntrospectionKeyRef = useRef<string | null>(null);
  const introspectionKey = data?.url ? `${entityId ?? 'none'}:${data.url}` : null;

  useEffect(() => {
    if (!introspectionKey || isIntrospecting || lastIntrospectionKeyRef.current === introspectionKey) return;

    const timeoutId = setTimeout(() => {
      lastIntrospectionKeyRef.current = introspectionKey;
      void handleIntrospect();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [handleIntrospect, introspectionKey, isIntrospecting]);

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

  const bodyValue = getGraphqlBodyValue(data.requestBody);
  const requestEditor = (
    <GraphqlRequestTabs
      key={entityId}
      query={bodyValue.query}
      variables={bodyValue.variables}
      headers={data.requestHeaders || []}
      script={data.script}
      searchParams={data.searchParameters || []}
      pathParams={pathParams}
      url={data.url || ''}
      schema={schema}
      queryBuilderOperations={queryBuilderOperations}
      queryBuilderActiveOperation={queryBuilderActiveOperation}
      queryBuilderCurrentOperation={queryBuilderCurrentOperation}
      queryBuilderGeneratedQuery={queryBuilderGeneratedQuery}
      onQueryChange={handleQueryChange}
      onVariablesChange={handleVariablesChange}
      onHeadersChange={handleHeadersChange}
      onScriptChange={handleScriptChange}
      onSearchParamsChange={handleSearchParamsChange}
      onPathParamsChange={handlePathParamsChange}
      onQueryBuilderActiveOperationChange={setQueryBuilderActiveOperation}
      onQueryBuilderToggleField={queryBuilderToggleField}
      onQueryBuilderToggleExpand={queryBuilderToggleExpand}
      onQueryBuilderSetArgValue={queryBuilderSetArgValue}
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
    <main className="flex h-full w-full flex-col overflow-hidden">
      <div className="shrink-0 space-y-4 p-4">
        <RequestTabList />
        <GraphqlUrlBar
          url={data.url || ''}
          onUrlChange={handleUrlChange}
          onSend={handleSendSafely}
          onCancel={handleCancel}
          onIntrospect={handleIntrospect}
          onVariableClick={renderVariablePopover}
          isSending={isRequestActive}
          isSaving={isSaving}
          isIntrospecting={isIntrospecting}
        />
      </div>
      {introspectionError ? (
        <InlineErrorBanner
          message={`Schema introspection failed: ${introspectionError}`}
          actionLabel="Retry introspection"
          onAction={() => void handleIntrospect()}
        />
      ) : null}
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
