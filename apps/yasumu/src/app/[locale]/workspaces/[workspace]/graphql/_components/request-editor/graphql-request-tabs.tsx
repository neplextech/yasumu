'use client';

import { useCallback, useMemo } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import { TextEditor } from '@/components/editors';
import { Input } from '@yasumu/ui/components/input';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@yasumu/ui/components/table';
import KeyValueTable, {
  type KeyValuePair,
} from '@/components/tables/key-value-table';
import { InteropableInput, useVariablePopover } from '@/components/inputs';
import type { TabularPair, YasumuEmbeddedScript } from '@yasumu/common';
import { YasumuScriptingLanguage } from '@yasumu/common';
import { GRAPHQL_SCRIPT_PLACEHOLDER } from './common';
import { YASUMU_TYPE_DEFINITIONS } from '@/lib/types/yasumu-typedef';
import { VariablesEditor } from './variables-editor';
import { QueryBuilder } from './query-builder';
import type { GraphQLSchema } from 'graphql';
import type { RootOperation } from '../../_hooks/use-query-builder';

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
  onPathParamsChange: (
    params: Record<string, { value: string; enabled: boolean }>,
  ) => void;
  onQueryBuilderActiveOperationChange: (
    op: 'query' | 'mutation' | 'subscription',
  ) => void;
  onQueryBuilderToggleField: (path: number[]) => void;
  onQueryBuilderToggleExpand: (path: number[]) => void;
  onQueryBuilderSetArgValue: (
    path: number[],
    argName: string,
    value: string,
  ) => void;
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

  return (
    <Tabs defaultValue="query" className="flex-1 flex flex-col h-full min-h-0">
      <div className="px-1 border-b shrink-0">
        <TabsList className="bg-transparent h-10 w-full justify-start gap-2">
          <TabsTrigger value="query">Query</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="parameters">Params</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="query-builder">Query Builder</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
        </TabsList>
      </div>

      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        <TabsContent value="query" className="h-full mt-0">
          <div className="flex flex-col gap-2 h-full min-h-0">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-sm text-muted-foreground font-medium">
                GraphQL Query
              </span>
            </div>
            <TextEditor
              value={query}
              onChange={onQueryChange}
              language="graphql"
              placeholder={
                <div className="text-sm text-muted-foreground font-medium opacity-40 ml-2">
                  <pre className="font-mono text-sm whitespace-pre-wrap">{`query GetUsers {
  users {
    id
    name
    email
  }
}`}</pre>
                </div>
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="variables" className="h-full mt-0">
          <VariablesEditor
            variables={variables}
            onChange={onVariablesChange}
          />
        </TabsContent>

        <TabsContent value="parameters" className="h-full mt-0 space-y-4">
          {hasPathParams && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground font-medium">
                Path Parameters
              </div>
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
                            onCheckedChange={(checked) =>
                              handlePathParamChange(
                                key,
                                'enabled',
                                checked === true,
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={key}
                            disabled
                            readOnly
                            className="bg-muted font-mono text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <InteropableInput
                            value={param.value}
                            onChange={(val) =>
                              handlePathParamChange(key, 'value', val)
                            }
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
            <div className="text-sm text-muted-foreground font-medium">
              Search Parameters
            </div>
            <KeyValueTable
              pairs={searchParams as KeyValuePair[]}
              onChange={(pairs) =>
                onSearchParamsChange(pairs as TabularPair[])
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="headers" className="h-full mt-0 space-y-2">
          <div className="text-sm text-muted-foreground font-medium">
            Request Headers
          </div>
          <KeyValueTable
            pairs={headers as KeyValuePair[]}
            onChange={(pairs) => onHeadersChange(pairs as TabularPair[])}
          />
        </TabsContent>

        <TabsContent value="query-builder" className="h-full mt-0">
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
        </TabsContent>

        <TabsContent value="scripts" className="h-full mt-0">
          <div className="flex flex-col gap-2 h-full min-h-0">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-sm text-muted-foreground font-medium">
                Request Scripts
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                onRequest(req) · onResponse(req, res) · onTest(req, res)
              </span>
            </div>
            <TextEditor
              value={script?.code || ''}
              onChange={handleScriptCodeChange}
              typeDefinitions={YASUMU_TYPE_DEFINITIONS}
              placeholder={
                <div className="text-sm text-muted-foreground font-medium opacity-40 ml-2">
                  <h1 className="font-bold underline">
                    Edit to hide this example placeholder
                  </h1>
                  <h1>Export onRequest to modify request before sending</h1>
                  <h1>Export onResponse to process response after receiving</h1>
                  <h1>Example:</h1>
                  <pre className="font-mono text-sm whitespace-pre-wrap mt-4">
                    {GRAPHQL_SCRIPT_PLACEHOLDER}
                  </pre>
                </div>
              }
            />
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
