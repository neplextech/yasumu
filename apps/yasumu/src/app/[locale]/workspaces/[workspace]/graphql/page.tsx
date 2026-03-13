'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Separator } from '@yasumu/ui/components/separator';
import YasumuBackgroundArt from '@/components/visuals/yasumu-background-art';
import LoadingScreen from '@/components/visuals/loading-screen';
import { useGraphqlContext } from './_providers/graphql-context';
import { useGraphqlEntity } from './_hooks/use-graphql-entity';
import { getGraphqlBodyValue } from './_hooks/use-graphql-entity';
import { useGraphqlRequest } from './_hooks/use-graphql-request';
import { useGraphqlIntrospection } from './_hooks/use-graphql-introspection';
import { useQueryBuilder } from './_hooks/use-query-builder';
import {
  preloadGraphQLLanguage,
  useMonacoGraphqlLanguage,
} from './_lib/monaco-graphql-support';
import { GraphqlUrlBar } from './_components/request-editor/graphql-url-bar';
import { GraphqlRequestTabs } from './_components/request-editor/graphql-request-tabs';
import { GraphqlResponsePanel } from './_components/response-panel';
import RequestTabList from './_components/tabs';
import { useAppLayout } from '@/components/providers/app-layout-provider';
import { YasumuLayout } from '@/lib/constants/layout';
import { useVariablePopover } from '@/components/inputs';
import type { TabularPair, YasumuEmbeddedScript } from '@yasumu/core';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@yasumu/ui/components/resizable';
import { useHotkeys } from 'react-hotkeys-hook';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';

function tabularPairsToRecord(
  pairs: TabularPair[] | undefined,
): Record<string, { value: string; enabled: boolean }> {
  if (!pairs) return {};
  return pairs.reduce(
    (acc, pair) => {
      if (pair.key) {
        acc[pair.key] = { value: pair.value, enabled: pair.enabled };
      }
      return acc;
    },
    {} as Record<string, { value: string; enabled: boolean }>,
  );
}

export default function GraphqlPage() {
  const { entityId } = useGraphqlContext();
  const { layout } = useAppLayout();
  const { renderVariablePopover } = useVariablePopover();
  const {
    data,
    isLoading,
    error,
    isSaving,
    updateField,
    updateBodyValue,
    save,
  } = useGraphqlEntity({
    entityId,
  });
  const {
    state: requestState,
    execute,
    cancel,
  } = useGraphqlRequest({ entityId });

  // Introspection
  const {
    schema,
    isLoading: isIntrospecting,
    error: introspectionError,
    introspect,
  } = useGraphqlIntrospection();

  // Monaco GraphQL IntelliSense
  useMonacoGraphqlLanguage(schema);

  useEffect(() => {
    preloadGraphQLLanguage(schema);
  }, [schema]);

  // Query builder
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

  // Path params
  const pathParams = useMemo(
    () =>
      data?.requestParameters
        ? tabularPairsToRecord(data.requestParameters as TabularPair[])
        : {},
    [data?.requestParameters],
  );

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
    (params: Record<string, { value: string; enabled: boolean }>) => {
      const tabularParams = Object.entries(params).map(([key, val]) => ({
        key,
        value: val.value,
        enabled: val.enabled,
      }));
      updateField('requestParameters', tabularParams);
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

  const handleIntrospect = useCallback(async () => {
    if (!data?.url) return;
    const interpolatedHeaders = Object.fromEntries(
      (data.requestHeaders || [])
        .filter((h) => h.enabled && h.key)
        .map((h) => [h.key, h.value]),
    );
    await introspect(data.url, interpolatedHeaders);
  }, [data?.url, data?.requestHeaders, introspect]);

  // Auto-introspection
  const [lastIntrospectedUrl, setLastIntrospectedUrl] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!data?.url || isIntrospecting) return;

    // Initial load or URL changed
    if (data.url !== lastIntrospectedUrl) {
      console.log('Auto-introspecting', data.url);
      const timeoutId = setTimeout(() => {
        handleIntrospect();
        setLastIntrospectedUrl(data.url!);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [data?.url, isIntrospecting, lastIntrospectedUrl, handleIntrospect]);

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
      query={getGraphqlBodyValue(data.requestBody).query}
      variables={getGraphqlBodyValue(data.requestBody).variables}
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
    <main className="w-full h-full flex flex-col overflow-hidden">
      <div className="p-4 space-y-4 shrink-0">
        <RequestTabList />
        <GraphqlUrlBar
          url={data.url || ''}
          onUrlChange={handleUrlChange}
          onSend={handleSend}
          onCancel={handleCancel}
          onIntrospect={handleIntrospect}
          onVariableClick={renderVariablePopover}
          isSending={isRequestActive}
          isSaving={isSaving}
          isIntrospecting={isIntrospecting}
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
