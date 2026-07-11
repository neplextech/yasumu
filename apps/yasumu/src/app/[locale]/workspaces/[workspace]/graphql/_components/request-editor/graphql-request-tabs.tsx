import type { TabularPair, YasumuEmbeddedScript } from '@yasumu/core';
import { YasumuScriptingLanguage } from '@yasumu/core';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import { Input } from '@yasumu/ui/components/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@yasumu/ui/components/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@yasumu/ui/components/tabs';
import type { GraphQLSchema } from 'graphql';
import { useQueryState, parseAsStringEnum } from 'nuqs';
import { useCallback, useMemo } from 'react';

import { TextEditor } from '@/components/editors';
import { InteropableInput, useVariablePopover } from '@/components/inputs';
import KeyValueTable, { type KeyValuePair } from '@/components/tables/key-value-table';
import { YASUMU_TYPE_DEFINITIONS } from '@/lib/types/yasumu-typedef';

import type { RootOperation } from '../../_hooks/use-query-builder';
import { GRAPHQL_SCRIPT_PLACEHOLDER } from './common';
import { DocumentationView } from './documentation-view';
import GraphqlTextEditor from './graphql-text-editor';
import { QueryBuilder } from './query-builder';
import { VariablesEditor } from './variables-editor';

interface GraphqlRequestTabsProps {
  query: string;
  variables: string;
  headers: TabularPair[];
  script: YasumuEmbeddedScript;
  searchParams: TabularPair[];
  pathParams: Record<string, { value: string; enabled: boolean }>;
  url: string;
  schema: GraphQLSchema | null;
  queryBuilderOperations: RootOperation[];
  queryBuilderActiveOperation: 'query' | 'mutation' | 'subscription';
  queryBuilderCurrentOperation: RootOperation | null;
  queryBuilderGeneratedQuery: string;
  onQueryChange: (query: string) => void;
  onVariablesChange: (variables: string) => void;
  onHeadersChange: (headers: TabularPair[]) => void;
  onScriptChange: (script: YasumuEmbeddedScript) => void;
  onSearchParamsChange: (params: TabularPair[]) => void;
  onPathParamsChange: (params: Record<string, { value: string; enabled: boolean }>) => void;
  onQueryBuilderActiveOperationChange: (op: 'query' | 'mutation' | 'subscription') => void;
  onQueryBuilderToggleField: (path: number[]) => void;
  onQueryBuilderToggleExpand: (path: number[]) => void;
  onQueryBuilderSetArgValue: (path: number[], argName: string, value: string) => void;
}

function extractPathParamKeys(url: string): string[] {
  try {
    const urlObj = new URL(url);
    const pathMatches = urlObj.pathname.matchAll(/:([a-zA-Z_][a-zA-Z0-9_]*)/g);
    return Array.from(new Set(Array.from(pathMatches).map((m) => m[1])));
  } catch {
    const withoutProtocol = url.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '');
    const pathStart = withoutProtocol.indexOf('/');
    if (pathStart === -1) return [];
    const pathPortion = withoutProtocol.slice(pathStart);
    const matches = pathPortion.matchAll(/:([a-zA-Z_][a-zA-Z0-9_]*)/g);
    return Array.from(new Set(Array.from(matches).map((m) => m[1])));
  }
}

export function GraphqlRequestTabs({
  query,
  variables,
  headers,
  script,
  searchParams,
  pathParams,
  url,
  schema,
  queryBuilderOperations,
  queryBuilderActiveOperation,
  queryBuilderCurrentOperation,
  queryBuilderGeneratedQuery,
  onQueryChange,
  onVariablesChange,
  onHeadersChange,
  onScriptChange,
  onSearchParamsChange,
  onPathParamsChange,
  onQueryBuilderActiveOperationChange,
  onQueryBuilderToggleField,
  onQueryBuilderToggleExpand,
  onQueryBuilderSetArgValue,
}: GraphqlRequestTabsProps) {
  const { renderVariablePopover } = useVariablePopover();
  const pathParamKeys = useMemo(() => extractPathParamKeys(url), [url]);
  const hasPathParams = pathParamKeys.length > 0;

  const handlePathParamChange = useCallback(
    (key: string, field: 'value' | 'enabled', value: string | boolean) => {
      const current = pathParams[key] || { value: '', enabled: true };
      onPathParamsChange({
        ...pathParams,
        [key]: { ...current, [field]: value },
      });
    },
    [pathParams, onPathParamsChange],
  );

  const handleScriptCodeChange = useCallback(
    (code: string) => {
      onScriptChange({
        language: script?.language || YasumuScriptingLanguage.JavaScript,
        code,
      });
    },
    [script?.language, onScriptChange],
  );

  const handleApplyBuiltQuery = useCallback(
    (builtQuery: string) => {
      onQueryChange(builtQuery);
    },
    [onQueryChange],
  );

  const [requestTab, setRequestTab] = useQueryState(
    'requestTab',
    parseAsStringEnum(['query', 'variables', 'parameters', 'headers', 'scripts']).withDefault('query'),
  );

  const [querySubTab, setQuerySubTab] = useQueryState(
    'queryView',
    parseAsStringEnum(['editor', 'query-builder', 'docs']).withDefault('editor'),
  );

  return (
    <Tabs
      value={requestTab || 'query'}
      onValueChange={(v) => setRequestTab(v as 'query' | 'variables' | 'parameters' | 'headers' | 'scripts')}
      className="flex h-full min-h-0 flex-1 flex-col"
    >
      <div className="shrink-0 border-b px-1">
        <TabsList className="h-10 w-full justify-start gap-2 bg-transparent">
          <TabsTrigger value="query">Query</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="parameters">Params</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
        </TabsList>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <TabsContent value="query" className="mt-0 h-full">
          <div className="flex h-full min-h-0 flex-col">
            <div className="mb-2 flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setQuerySubTab('editor')}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  querySubTab === 'editor'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setQuerySubTab('query-builder')}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  querySubTab === 'query-builder'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                Query Builder
              </button>
              <button
                type="button"
                onClick={() => setQuerySubTab('docs')}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  querySubTab === 'docs'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                Documentation
              </button>
            </div>

            {querySubTab === 'editor' && (
              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <GraphqlTextEditor query={query} onQueryChange={onQueryChange} />
              </div>
            )}

            {querySubTab === 'query-builder' && (
              <QueryBuilder
                operations={queryBuilderOperations}
                activeOperation={queryBuilderActiveOperation}
                currentOperation={queryBuilderCurrentOperation}
                generatedQuery={queryBuilderGeneratedQuery}
                onActiveOperationChange={onQueryBuilderActiveOperationChange}
                onToggleField={onQueryBuilderToggleField}
                onToggleExpand={onQueryBuilderToggleExpand}
                onSetArgValue={onQueryBuilderSetArgValue}
                onApplyQuery={handleApplyBuiltQuery}
              />
            )}

            {querySubTab === 'docs' && (
              <div className="flex h-full min-h-0 flex-col">
                <DocumentationView schema={schema} />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="variables" className="mt-0 h-full">
          <VariablesEditor variables={variables} onChange={onVariablesChange} />
        </TabsContent>

        <TabsContent value="parameters" className="mt-0 h-full space-y-4">
          {hasPathParams && (
            <div className="space-y-2">
              <div className="text-muted-foreground text-sm font-medium">Path Parameters</div>
              <Table className="border">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">On</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pathParamKeys.map((key) => {
                    const param = pathParams[key] || {
                      value: '',
                      enabled: true,
                    };
                    return (
                      <TableRow key={key}>
                        <TableCell>
                          <Checkbox
                            checked={param.enabled}
                            onCheckedChange={(checked) => handlePathParamChange(key, 'enabled', checked === true)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input value={key} disabled readOnly className="bg-muted font-mono text-sm" />
                        </TableCell>
                        <TableCell>
                          <InteropableInput
                            value={param.value}
                            onChange={(val) => handlePathParamChange(key, 'value', val)}
                            onVariableClick={renderVariablePopover}
                            placeholder="Enter value"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-muted-foreground text-sm font-medium">Search Parameters</div>
            <KeyValueTable
              pairs={searchParams as KeyValuePair[]}
              onChange={(pairs) => onSearchParamsChange(pairs as TabularPair[])}
            />
          </div>
        </TabsContent>

        <TabsContent value="headers" className="mt-0 h-full space-y-2">
          <div className="text-muted-foreground text-sm font-medium">Request Headers</div>
          <KeyValueTable
            pairs={headers as KeyValuePair[]}
            onChange={(pairs) => onHeadersChange(pairs as TabularPair[])}
          />
        </TabsContent>

        <TabsContent value="scripts" className="mt-0 h-full">
          <div className="flex h-full min-h-0 flex-col gap-2">
            <div className="flex shrink-0 items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">Request Scripts</span>
              <span className="text-muted-foreground font-mono text-xs">
                onRequest(req) · onResponse(req, res) · onTest(req, res)
              </span>
            </div>
            <TextEditor
              value={script?.code || ''}
              onChange={handleScriptCodeChange}
              typeDefinitions={YASUMU_TYPE_DEFINITIONS}
              placeholder={
                <div className="text-muted-foreground ml-2 text-sm font-medium opacity-40">
                  <h1 className="font-bold underline">Edit to hide this example placeholder</h1>
                  <h1>Export onRequest to modify request before sending</h1>
                  <h1>Export onResponse to process response after receiving</h1>
                  <h1>Example:</h1>
                  <pre className="mt-4 font-mono text-sm whitespace-pre-wrap">{GRAPHQL_SCRIPT_PLACEHOLDER}</pre>
                </div>
              }
            />
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
