'use client';

import { useCallback } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import { TextEditor } from '@/components/editors';
import KeyValueTable, {
  type KeyValuePair,
} from '@/components/tables/key-value-table';
import type { TabularPair, YasumuEmbeddedScript } from '@yasumu/common';
import { YasumuScriptingLanguage } from '@yasumu/common';
import { GRAPHQL_SCRIPT_PLACEHOLDER } from './common';
import { YASUMU_TYPE_DEFINITIONS } from '@/lib/types/yasumu-typedef';

interface GraphqlRequestTabsProps {
  query: string;
  variables: string;
  headers: TabularPair[];
  script: YasumuEmbeddedScript;
  onQueryChange: (query: string) => void;
  onVariablesChange: (variables: string) => void;
  onHeadersChange: (headers: TabularPair[]) => void;
  onScriptChange: (script: YasumuEmbeddedScript) => void;
}

export function GraphqlRequestTabs({
  query,
  variables,
  headers,
  script,
  onQueryChange,
  onVariablesChange,
  onHeadersChange,
  onScriptChange,
}: GraphqlRequestTabsProps) {
  const handleScriptCodeChange = useCallback(
    (code: string) => {
      onScriptChange({
        language: script?.language || YasumuScriptingLanguage.JavaScript,
        code,
      });
    },
    [script?.language, onScriptChange],
  );

  return (
    <Tabs defaultValue="query" className="flex-1 flex flex-col h-full min-h-0">
      <div className="px-1 border-b shrink-0">
        <TabsList className="bg-transparent h-10 w-full justify-start gap-2">
          <TabsTrigger value="query">Query</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
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
          <div className="flex flex-col gap-2 h-full min-h-0">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-sm text-muted-foreground font-medium">
                Variables (JSON)
              </span>
            </div>
            <TextEditor
              value={variables}
              onChange={onVariablesChange}
              language="json"
              placeholder={
                <div className="text-sm text-muted-foreground font-medium opacity-40 ml-2">
                  <pre className="font-mono text-sm whitespace-pre-wrap">{`{
  "userId": "123",
  "limit": 10
}`}</pre>
                </div>
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
