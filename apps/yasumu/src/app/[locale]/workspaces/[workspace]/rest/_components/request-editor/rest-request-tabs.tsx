'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import { Textarea } from '@yasumu/ui/components/textarea';
import { Input } from '@yasumu/ui/components/input';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import { Button } from '@yasumu/ui/components/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@yasumu/ui/components/table';
import { Trash } from 'lucide-react';
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
  const matches = url.matchAll(/:([a-zA-Z0-9_]+)/g);
  return Array.from(new Set(Array.from(matches).map((m) => m[1])));
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
        <TabsList className="bg-transparent h-10 w-full justify-start gap-2 p-0 rounded-none">
          <TabsTrigger
            value="parameters"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
          >
            Parameters
          </TabsTrigger>
          <TabsTrigger
            value="headers"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
          >
            Headers
          </TabsTrigger>
          <TabsTrigger
            value="auth"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
          >
            Auth
          </TabsTrigger>
          <TabsTrigger
            value="body"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
          >
            Body
          </TabsTrigger>
          <TabsTrigger
            value="scripts"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
          >
            Scripts
          </TabsTrigger>
          <TabsTrigger
            value="tests"
            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-full"
          >
            Tests
          </TabsTrigger>
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
          <div className="flex flex-col gap-2 h-full">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">
                Request Scripts
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                onRequest(req) · onResponse(req, res)
              </span>
            </div>
            <Textarea
              value={script?.code || ''}
              onChange={(e) => handleScriptCodeChange(e.target.value)}
              placeholder={`// Request lifecycle scripts
// Export onRequest to modify request before sending
// Export onResponse to process response after receiving

export function onRequest(req) {
  // Modify request headers, body, etc.
  // req.headers.set('X-Custom', 'value');
  // Return a response object to show fake response data
  // return new YasumuResponse(200, { body: 'Hello, world!' });
}

export function onResponse(req, res) {
  // Process response data
  // console.log(res.status);
}`}
              className="flex-1 resize-none font-mono text-sm bg-muted/30 border-muted-foreground/20 p-4 min-h-[300px]"
              spellCheck={false}
            />
          </div>
        </TabsContent>

        <TabsContent value="tests" className="h-full mt-0">
          <div className="flex flex-col gap-2 h-full">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">
                Test Assertions
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                test(name, fn)
              </span>
            </div>
            <Textarea
              value={testScript?.code || ''}
              onChange={(e) => handleTestScriptCodeChange(e.target.value)}
              disabled // TODO: Implement test assertions
              placeholder={`// Test assertions
// Write tests to validate response data

test('status should be 200', (ctx) => {
  expect(ctx.response.status).toBe(200);
});

test('should return user data', (ctx) => {
  const body = JSON.parse(ctx.response.body);
  expect(body.id).toBeDefined();
  expect(body.name).toBeString();
});`}
              className="flex-1 resize-none font-mono text-sm bg-muted/30 border-muted-foreground/20 p-4 min-h-[300px]"
              spellCheck={false}
            />
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
