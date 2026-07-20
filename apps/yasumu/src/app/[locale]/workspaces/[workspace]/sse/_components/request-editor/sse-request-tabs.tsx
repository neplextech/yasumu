'use client';

import type { RestEntityRequestBody, TabularPair, YasumuEmbeddedScript } from '@yasumu/core';
import { YasumuScriptingLanguage } from '@yasumu/core';
import { Button } from '@yasumu/ui/components/button';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import { Input } from '@yasumu/ui/components/input';
import { Label } from '@yasumu/ui/components/label';
import { Switch } from '@yasumu/ui/components/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@yasumu/ui/components/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@yasumu/ui/components/tabs';
import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useId, useMemo } from 'react';

import { extractPathParameterKeys } from '@/app/[locale]/workspaces/[workspace]/_lib/request-path-parameters';
import { BodyEditor } from '@/app/[locale]/workspaces/[workspace]/rest/_components/request-editor/body-editor';
import { SSE_SCRIPT_SNIPPETS, TextEditor } from '@/components/editors';
import { InteropableInput, useVariablePopover } from '@/components/inputs';
import KeyValueTable, { type KeyValuePair } from '@/components/tables/key-value-table';
import { useStableRowKeys } from '@/components/tables/use-stable-row-keys';
import { YASUMU_TYPE_DEFINITIONS } from '@/lib/types/yasumu-typedef';

interface SseRequestTabsProps {
  url: string;
  searchParams: TabularPair[];
  pathParams: Record<string, { value: string; enabled: boolean }>;
  headers: TabularPair[];
  body: RestEntityRequestBody | null;
  eventTypes: string[];
  reconnect: { enabled: boolean; retryMs: number };
  script: YasumuEmbeddedScript;
  testScript: YasumuEmbeddedScript | null;
  onSearchParamsChange(value: TabularPair[]): void;
  onPathParamsChange(value: Record<string, { value: string; enabled: boolean }>): void;
  onHeadersChange(value: TabularPair[]): void;
  onBodyChange(value: RestEntityRequestBody | null): void;
  onEventTypesChange(value: string[]): void;
  onReconnectChange(value: { enabled: boolean; retryMs: number }): void;
  onScriptChange(value: YasumuEmbeddedScript): void;
  onTestScriptChange(value: YasumuEmbeddedScript | null): void;
}

export function SseRequestTabs(props: SseRequestTabsProps) {
  const { renderVariablePopover } = useVariablePopover();
  const retryId = useId();
  const pathKeys = useMemo(() => extractPathParameterKeys(props.url), [props.url]);
  const { rowKeys, insertKey, removeKey } = useStableRowKeys(props.eventTypes.length);
  const updatePath = useCallback(
    (key: string, update: Partial<{ value: string; enabled: boolean }>) => {
      props.onPathParamsChange({
        ...props.pathParams,
        [key]: { ...(props.pathParams[key] ?? { value: '', enabled: true }), ...update },
      });
    },
    [props],
  );
  const updateScript = useCallback(
    (code: string) =>
      props.onScriptChange({ language: props.script?.language ?? YasumuScriptingLanguage.JavaScript, code }),
    [props],
  );
  const updateTestScript = useCallback(
    (code: string) =>
      props.onTestScriptChange({
        language: props.testScript?.language ?? YasumuScriptingLanguage.JavaScript,
        code,
      }),
    [props],
  );

  return (
    <Tabs defaultValue="parameters" className="flex h-full min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b px-1">
        <TabsList className="h-10 w-full justify-start gap-2 bg-transparent">
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          <TabsTrigger value="settings">Reconnect</TabsTrigger>
        </TabsList>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <TabsContent value="parameters" className="mt-0 flex h-full flex-col gap-4">
          {pathKeys.length ? (
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground text-sm font-medium">Path Parameters</p>
              <Table className="border">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">On</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pathKeys.map((key) => {
                    const parameter = props.pathParams[key] ?? { value: '', enabled: true };
                    return (
                      <TableRow key={key}>
                        <TableCell>
                          <Checkbox
                            checked={parameter.enabled}
                            onCheckedChange={(checked) => updatePath(key, { enabled: checked === true })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input value={key} disabled readOnly className="bg-muted font-mono text-sm" />
                        </TableCell>
                        <TableCell>
                          <InteropableInput
                            value={parameter.value}
                            onChange={(value) => updatePath(key, { value })}
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
          ) : null}
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-sm font-medium">Query Parameters</p>
            <KeyValueTable
              pairs={props.searchParams as KeyValuePair[]}
              onChange={(pairs) => props.onSearchParamsChange(pairs as TabularPair[])}
            />
          </div>
        </TabsContent>
        <TabsContent value="headers" className="mt-0 flex h-full flex-col gap-2">
          <p className="text-muted-foreground text-sm font-medium">Request Headers</p>
          <KeyValueTable
            pairs={props.headers as KeyValuePair[]}
            onChange={(pairs) => props.onHeadersChange(pairs as TabularPair[])}
          />
        </TabsContent>
        <TabsContent value="body" className="mt-0 h-full">
          <BodyEditor body={props.body} onChange={props.onBodyChange} />
        </TabsContent>
        <TabsContent value="events" className="mt-0 flex h-full flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Accepted event types</p>
              <p className="text-muted-foreground text-xs">Leave empty to receive every event type.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                insertKey(props.eventTypes.length);
                props.onEventTypesChange([...props.eventTypes, '']);
              }}
            >
              <Plus data-icon="inline-start" /> Add event
            </Button>
          </div>
          {props.eventTypes.map((eventType, index) => (
            <div key={rowKeys[index]} className="flex items-center gap-2">
              <InteropableInput
                aria-label={`SSE event type ${index + 1}`}
                value={eventType}
                onChange={(value) =>
                  props.onEventTypesChange(
                    props.eventTypes.map((item, itemIndex) => (itemIndex === index ? value : item)),
                  )
                }
                onVariableClick={renderVariablePopover}
                placeholder="message, update, notification..."
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove SSE event type ${index + 1}`}
                onClick={() => {
                  removeKey(index);
                  props.onEventTypesChange(props.eventTypes.filter((_, itemIndex) => itemIndex !== index));
                }}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          ))}
          {!props.eventTypes.length ? (
            <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
              All event types will be displayed.
            </p>
          ) : null}
        </TabsContent>
        <TabsContent value="scripts" className="mt-0 h-full">
          <Tabs defaultValue="lifecycle" className="flex h-full min-h-0 flex-col">
            <TabsList className="shrink-0 self-start">
              <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
              <TabsTrigger value="tests">Tests</TabsTrigger>
            </TabsList>
            <TabsContent value="lifecycle" className="min-h-0 flex-1">
              <TextEditor
                value={props.script?.code ?? ''}
                onChange={updateScript}
                typeDefinitions={YASUMU_TYPE_DEFINITIONS}
                snippets={SSE_SCRIPT_SNIPPETS}
                placeholder="Export onRequest and onResponse hooks for this stream."
              />
            </TabsContent>
            <TabsContent value="tests" className="min-h-0 flex-1">
              <TextEditor
                value={props.testScript?.code ?? ''}
                onChange={updateTestScript}
                typeDefinitions={YASUMU_TYPE_DEFINITIONS}
                snippets={SSE_SCRIPT_SNIPPETS}
                placeholder="Export onTest and use yasumu:test assertions."
              />
            </TabsContent>
          </Tabs>
        </TabsContent>
        <TabsContent value="settings" className="mt-0 flex h-full max-w-xl flex-col gap-5">
          <div className="flex items-center justify-between gap-4 rounded-md border p-4">
            <div>
              <p className="text-sm font-medium">Automatic reconnect</p>
              <p className="text-muted-foreground text-xs">Reconnect after the server closes the stream.</p>
            </div>
            <Switch
              checked={props.reconnect.enabled}
              onCheckedChange={(enabled) => props.onReconnectChange({ ...props.reconnect, enabled })}
              aria-label="Automatic SSE reconnect"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={retryId}>Default retry delay (milliseconds)</Label>
            <Input
              id={retryId}
              type="number"
              min={0}
              step={100}
              value={props.reconnect.retryMs}
              onChange={(event) => {
                const retryMs = Number(event.target.value);
                if (Number.isFinite(retryMs) && retryMs >= 0) props.onReconnectChange({ ...props.reconnect, retryMs });
              }}
            />
            <p className="text-muted-foreground text-xs">
              A server retry field overrides this delay for later attempts.
            </p>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
