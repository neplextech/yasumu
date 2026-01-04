'use client';

import { useCallback, useMemo } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import { TextEditor, type TypeDefinition } from '@/components/editors';
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
import { BodyEditor } from './body-editor';
import AuthEditor from './auth-editor';
import type {
  RestEntityRequestBody,
  TabularPair,
  YasumuEmbeddedScript,
} from '@yasumu/common';
import { YasumuScriptingLanguage } from '@yasumu/common';
import { REQUEST_SCRIPT_PLACEHOLDER, TEST_SCRIPT_PLACEHOLDER } from './common';
import { YASUMU_TYPE_DEFINITIONS } from '@/lib/types/yasumu-typedef';

interface RestRequestTabsProps {
  searchParams: TabularPair[];
  pathParams: Record<string, { value: string; enabled: boolean }>;
  headers: TabularPair[];
  body: RestEntityRequestBody | null;
  script: YasumuEmbeddedScript;
  testScript: YasumuEmbeddedScript;
  url: string;
  onSearchParamsChange: (params: TabularPair[]) => void;
  onPathParamsChange: (
    params: Record<string, { value: string; enabled: boolean }>,
  ) => void;
  onHeadersChange: (headers: TabularPair[]) => void;
  onBodyChange: (body: { type: string; data: unknown } | null) => void;
  onScriptChange: (script: YasumuEmbeddedScript) => void;
  onTestScriptChange: (script: YasumuEmbeddedScript) => void;
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

export function RestRequestTabs({
  searchParams,
  pathParams,
  headers,
  body,
  script,
  testScript,
  url,
  onSearchParamsChange,
  onPathParamsChange,
  onHeadersChange,
  onBodyChange,
  onScriptChange,
  onTestScriptChange,
}: RestRequestTabsProps) {
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

  const handleTestScriptCodeChange = useCallback(
    (code: string) => {
      onTestScriptChange({
        language: testScript?.language || YasumuScriptingLanguage.JavaScript,
        code,
      });
    },
    [testScript?.language, onTestScriptChange],
  );

  return (
    <Tabs
      defaultValue="parameters"
      className="flex-1 flex flex-col h-full min-h-0"
    >
      <div className="px-1 border-b flex-shrink-0">
        <TabsList className="bg-transparent h-10 w-full justify-start gap-2">
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="auth">Auth</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
        </TabsList>
      </div>

      <div className="flex-1 overflow-y-auto p-4 min-h-0">
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
                          <Input
                            value={param.value}
                            onChange={(e) =>
                              handlePathParamChange(
                                key,
                                'value',
                                e.target.value,
                              )
                            }
                            placeholder="Enter value"
                            className="font-mono text-sm"
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
              onChange={(pairs) => onSearchParamsChange(pairs as TabularPair[])}
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

        <TabsContent value="auth" className="h-full mt-0">
          <AuthEditor
            headers={headers as KeyValuePair[]}
            onChange={(pairs) => onHeadersChange(pairs as TabularPair[])}
          />
        </TabsContent>

        <TabsContent value="body" className="h-full mt-0">
          <BodyEditor
            body={body ? { type: body.type, data: body.value } : null}
            onChange={onBodyChange}
          />
        </TabsContent>

        <TabsContent value="scripts" className="h-full mt-0">
          <div className="flex flex-col gap-2 h-full min-h-0">
            <div className="flex items-center justify-between flex-shrink-0">
              <span className="text-sm text-muted-foreground font-medium">
                Request Scripts
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                onRequest(req) · onResponse(req, res)
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
                  <h1>
                    Export onResponse to process response after receiving export
                  </h1>
                  <h1>Example:</h1>
                  <pre className="font-mono text-sm whitespace-pre-wrap mt-4">
                    {REQUEST_SCRIPT_PLACEHOLDER}
                  </pre>
                </div>
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="tests" className="h-full mt-0">
          <div className="flex flex-col gap-2 h-full min-h-0">
            <div className="flex items-center justify-between flex-shrink-0">
              <span className="text-sm text-muted-foreground font-medium">
                Test Assertions
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                test(name, fn)
              </span>
            </div>
            <TextEditor
              value={testScript?.code || ''}
              onChange={handleTestScriptCodeChange}
              typeDefinitions={YASUMU_TYPE_DEFINITIONS}
              readOnly
              placeholder={TEST_SCRIPT_PLACEHOLDER}
            />
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
