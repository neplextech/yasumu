'use client';

import type { RestEntityRequestBody, TabularPair, YasumuEmbeddedScript } from '@yasumu/core';
import { YasumuScriptingLanguage } from '@yasumu/core';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import { Input } from '@yasumu/ui/components/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@yasumu/ui/components/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@yasumu/ui/components/tabs';
import { useCallback, useMemo } from 'react';

import { TextEditor } from '@/components/editors';
import { InteropableInput, useVariablePopover } from '@/components/inputs';
import KeyValueTable, { type KeyValuePair } from '@/components/tables/key-value-table';
import { YASUMU_TYPE_DEFINITIONS } from '@/lib/types/yasumu-typedef';

import AuthEditor from './auth-editor';
import { BodyEditor } from './body-editor';
import { REQUEST_SCRIPT_PLACEHOLDER } from './common';

interface RestRequestTabsProps {
  searchParams: TabularPair[];
  pathParams: Record<string, { value: string; enabled: boolean }>;
  headers: TabularPair[];
  body: RestEntityRequestBody | null;
  script: YasumuEmbeddedScript;
  url: string;
  onSearchParamsChange: (params: TabularPair[]) => void;
  onPathParamsChange: (params: Record<string, { value: string; enabled: boolean }>) => void;
  onHeadersChange: (headers: TabularPair[]) => void;
  onBodyChange: (body: RestEntityRequestBody | null) => void;
  onScriptChange: (script: YasumuEmbeddedScript) => void;
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
  url,
  onSearchParamsChange,
  onPathParamsChange,
  onHeadersChange,
  onBodyChange,
  onScriptChange,
}: RestRequestTabsProps) {
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

  return (
    <Tabs defaultValue="parameters" className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex-shrink-0 border-b px-1">
        <TabsList className="h-10 w-full justify-start gap-2 bg-transparent">
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="auth">Auth</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          {/* <TabsTrigger value="tests">Tests</TabsTrigger> */}
        </TabsList>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
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

        <TabsContent value="auth" className="mt-0 h-full">
          <AuthEditor
            headers={headers as KeyValuePair[]}
            onChange={(pairs) => onHeadersChange(pairs as TabularPair[])}
          />
        </TabsContent>

        <TabsContent value="body" className="mt-0 h-full">
          <BodyEditor body={body} onChange={onBodyChange} />
        </TabsContent>

        <TabsContent value="scripts" className="mt-0 h-full">
          <div className="flex h-full min-h-0 flex-col gap-2">
            <div className="flex flex-shrink-0 items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">Request Scripts</span>
              <span className="text-muted-foreground font-mono text-xs">
                onRequest(ctx) · onResponse(ctx) · onTest(ctx)
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
                  <h1>Export onResponse to process response after receiving export</h1>
                  <h1>Example:</h1>
                  <pre className="mt-4 font-mono text-sm whitespace-pre-wrap">{REQUEST_SCRIPT_PLACEHOLDER}</pre>
                </div>
              }
            />
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
