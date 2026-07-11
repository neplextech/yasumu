'use client';

import { Badge } from '@yasumu/ui/components/badge';
import { Button } from '@yasumu/ui/components/button';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@yasumu/ui/components/hover-card';
import { Input } from '@yasumu/ui/components/input';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@yasumu/ui/components/resizable';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@yasumu/ui/components/tabs';
import { cn } from '@yasumu/ui/lib/utils';
import { ChevronDown, ChevronRight, Copy, Check, Search, Braces, Info, ListTree, Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';

import type { FieldNode, RootOperation } from '../../_hooks/use-query-builder';

interface QueryBuilderProps {
  operations: RootOperation[];
  activeOperation: 'query' | 'mutation' | 'subscription';
  currentOperation: RootOperation | null;
  generatedQuery: string;
  onActiveOperationChange: (op: 'query' | 'mutation' | 'subscription') => void;
  onToggleField: (path: number[]) => void;
  onToggleExpand: (path: number[]) => void;
  onSetArgValue: (path: number[], argName: string, value: string) => void;
  onApplyQuery: (query: string) => void;
}

export function QueryBuilder({
  operations,
  activeOperation,
  currentOperation,
  generatedQuery,
  onActiveOperationChange,
  onToggleField,
  onToggleExpand,
  onSetArgValue,
  onApplyQuery,
}: QueryBuilderProps) {
  const [searchFilter, setSearchFilter] = useState('');
  const [copied, setCopied] = useState(false);
  const selectedFieldCount = currentOperation ? countSelectedFields(currentOperation.fields) : 0;
  const visibleFieldCount = currentOperation
    ? countVisibleFields(currentOperation.fields, searchFilter.toLowerCase())
    : 0;

  const handleCopy = useCallback(async () => {
    if (generatedQuery) {
      await navigator.clipboard.writeText(generatedQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generatedQuery]);

  const handleApply = useCallback(() => {
    if (generatedQuery) {
      onApplyQuery(generatedQuery);
    }
  }, [generatedQuery, onApplyQuery]);

  if (operations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-sm space-y-4 text-center">
          <div className="bg-muted/30 mx-auto grid size-12 place-items-center rounded-md border">
            <Braces className="text-muted-foreground h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">No schema loaded</p>
            <p className="text-muted-foreground text-xs leading-5">
              Introspect the current endpoint to browse root operations, select fields, and generate a query without
              leaving the editor.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const availableOps = operations.map((op) => op.type);

  return (
    <Tabs
      value={activeOperation}
      onValueChange={(v) => onActiveOperationChange(v as 'query' | 'mutation' | 'subscription')}
      className="flex h-full min-h-0 flex-col overflow-hidden"
    >
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b pb-2">
        <TabsList className="h-8">
          {availableOps.map((op) => (
            <TabsTrigger key={op} value={op} className="h-6 px-3 text-xs capitalize">
              {op}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <Badge variant="outline" className="h-6 rounded-sm font-mono">
            {selectedFieldCount} selected
          </Badge>
          {searchFilter && (
            <Badge variant="secondary" className="h-6 rounded-sm font-mono">
              {visibleFieldCount} matches
            </Badge>
          )}
        </div>
        <div className="flex-1" />
        <div className="relative w-44">
          <Search className="text-muted-foreground absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter fields..."
            className="h-8 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Resizable split: fields explorer | query preview */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={60} minSize={30}>
            <ScrollArea className="h-full">
              <div className="space-y-2 p-2">
                <div className="bg-muted/20 flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <ListTree className="text-muted-foreground h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium capitalize">{activeOperation}</div>
                      <div className="text-muted-foreground truncate text-[11px]">
                        Select fields and arguments to compose the operation.
                      </div>
                    </div>
                  </div>
                </div>
                {currentOperation && (
                  <>
                    {visibleFieldCount > 0 ? (
                      <FieldTree
                        fields={currentOperation.fields}
                        path={[]}
                        searchFilter={searchFilter.toLowerCase()}
                        onToggleField={onToggleField}
                        onToggleExpand={onToggleExpand}
                        onSetArgValue={onSetArgValue}
                      />
                    ) : (
                      <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-xs">
                        No fields match this filter.
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={40} minSize={20}>
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-muted-foreground h-3.5 w-3.5" />
                  <span className="text-muted-foreground text-xs font-medium">Generated Query</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCopy}
                    disabled={!generatedQuery}
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={handleApply}
                    disabled={!generatedQuery}
                  >
                    Apply
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <pre className="text-muted-foreground p-3 font-mono text-xs whitespace-pre-wrap">
                  {generatedQuery || '# Select fields on the left to build a query'}
                </pre>
              </ScrollArea>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Tabs>
  );
}

function countSelectedFields(fields: FieldNode[]): number {
  return fields.reduce((count, field) => count + (field.selected ? 1 : 0) + countSelectedFields(field.fields), 0);
}

function countVisibleFields(fields: FieldNode[], searchFilter: string): number {
  return fields.reduce((count, field) => {
    const matchesSearch = !searchFilter || field.name.toLowerCase().includes(searchFilter);
    const childCount = countVisibleFields(field.fields, searchFilter);

    return count + (matchesSearch || childCount > 0 ? 1 : 0) + childCount;
  }, 0);
}

// ─── Field documentation hover card (VS Code-like) ──────────────────────────

function FieldDocCard({ field }: { field: FieldNode }) {
  const hasArgs = field.args.length > 0;
  const hasChildren = field.fields.length > 0;

  return (
    <div className="space-y-2">
      {/* Signature */}
      <div className="text-foreground bg-muted/50 rounded px-2 py-1.5 font-mono text-xs leading-relaxed break-all">
        {field.name}
        {hasArgs && (
          <span className="text-muted-foreground">
            (
            {field.args.map((a, i) => (
              <span key={a.name}>
                {i > 0 && ', '}
                <span className="text-muted-foreground">{a.name}</span>
                <span className="text-muted-foreground/60">: </span>
                <span className="text-blue-400">{a.type}</span>
              </span>
            ))}
            )
          </span>
        )}
        <span className="text-muted-foreground/60">: </span>
        <span className="text-green-400">{field.type}</span>
      </div>

      {/* Description */}
      {field.description && <p className="text-muted-foreground text-xs leading-relaxed">{field.description}</p>}

      {/* Parameters */}
      {hasArgs && (
        <div className="space-y-1">
          <div className="text-muted-foreground/60 text-[10px] font-semibold tracking-wider uppercase">Parameters</div>
          <div className="space-y-0.5">
            {field.args.map((arg) => (
              <div key={arg.name} className="flex gap-1.5 text-xs">
                <span className="text-foreground shrink-0 font-mono">
                  {arg.name}
                  {arg.required && <span className="text-destructive">*</span>}
                </span>
                <span className="shrink-0 font-mono text-blue-400">{arg.type}</span>
                {arg.description && <span className="text-muted-foreground/70 truncate">- {arg.description}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Return type info */}
      <div className="border-border/50 flex items-center gap-1.5 border-t pt-0.5 text-xs">
        <span className="text-muted-foreground/60 text-[10px] font-semibold tracking-wider uppercase">Returns</span>
        <span className="font-mono text-green-400">{field.type}</span>
        {hasChildren && <span className="text-muted-foreground/50">({field.fields.length} fields)</span>}
      </div>
    </div>
  );
}

// ─── Field tree ──────────────────────────────────────────────────────────────

function FieldTree({
  fields,
  path,
  searchFilter,
  onToggleField,
  onToggleExpand,
  onSetArgValue,
}: {
  fields: FieldNode[];
  path: number[];
  searchFilter: string;
  onToggleField: (path: number[]) => void;
  onToggleExpand: (path: number[]) => void;
  onSetArgValue: (path: number[], argName: string, value: string) => void;
}) {
  return (
    <div className="space-y-px">
      {fields.map((field, index) => {
        const currentPath = [...path, index];
        const matchesSearch = !searchFilter || field.name.toLowerCase().includes(searchFilter);

        const childMatches = field.fields.some((f) => f.name.toLowerCase().includes(searchFilter));

        if (!matchesSearch && !childMatches) return null;

        return (
          <FieldItem
            key={field.name}
            field={field}
            path={currentPath}
            searchFilter={searchFilter}
            onToggleField={onToggleField}
            onToggleExpand={onToggleExpand}
            onSetArgValue={onSetArgValue}
          />
        );
      })}
    </div>
  );
}

// ─── Field item ──────────────────────────────────────────────────────────────

function FieldItem({
  field,
  path,
  searchFilter,
  onToggleField,
  onToggleExpand,
  onSetArgValue,
}: {
  field: FieldNode;
  path: number[];
  searchFilter: string;
  onToggleField: (path: number[]) => void;
  onToggleExpand: (path: number[]) => void;
  onSetArgValue: (path: number[], argName: string, value: string) => void;
}) {
  const hasChildren = field.fields.length > 0;
  const hasArgs = field.args.length > 0;
  const depth = path.length;

  return (
    <div className="w-full min-w-0">
      <div
        className={cn(
          'flex items-center gap-1 py-0.5 rounded-sm hover:bg-muted/50 group min-w-0',
          field.selected && 'bg-primary/5',
        )}
        style={{ paddingLeft: `${depth * 14 + 4}px`, paddingRight: 4 }}
      >
        {/* Expand/collapse chevron */}
        {hasChildren ? (
          <button onClick={() => onToggleExpand(path)} className="hover:bg-muted shrink-0 rounded p-0.5">
            {field.expanded ? (
              <ChevronDown className="text-muted-foreground h-3 w-3" />
            ) : (
              <ChevronRight className="text-muted-foreground h-3 w-3" />
            )}
          </button>
        ) : (
          <div className="w-4 shrink-0" />
        )}

        {/* Checkbox */}
        <Checkbox
          checked={field.selected}
          onCheckedChange={() => onToggleField(path)}
          className="h-3.5 w-3.5 shrink-0"
        />

        {/* Field name */}
        <span
          className={cn(
            'text-xs font-mono truncate min-w-0',
            field.selected ? 'text-foreground font-medium' : 'text-muted-foreground',
          )}
        >
          {field.name}
        </span>

        {hasArgs && (
          <Badge variant="outline" className="text-muted-foreground h-5 rounded-sm px-1.5 font-mono text-[10px]">
            {field.args.length} args
          </Badge>
        )}

        <span className="text-muted-foreground/70 max-w-32 truncate font-mono text-[10px]">{field.type}</span>

        {/* Spacer */}
        <div className="flex-1 shrink-0" />

        {/* Docs hover card trigger */}
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>
            <button className="hover:bg-muted shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Info className="text-muted-foreground/60 h-3 w-3" />
            </button>
          </HoverCardTrigger>
          <HoverCardContent side="right" align="start" sideOffset={8} className="w-[340px] p-3">
            <FieldDocCard field={field} />
          </HoverCardContent>
        </HoverCard>
      </div>

      {/* Inline argument inputs when field is selected */}
      {field.selected && hasArgs && (
        <div className="space-y-1 py-1" style={{ paddingLeft: `${depth * 14 + 34}px`, paddingRight: 8 }}>
          {field.args.map((arg) => (
            <div key={arg.name} className="flex min-w-0 items-center gap-2">
              <span className="text-muted-foreground shrink-0 font-mono text-[10px]">
                {arg.name}
                {arg.required && <span className="text-destructive">*</span>}
              </span>
              <Input
                value={field.argValues[arg.name] ?? ''}
                onChange={(e) => onSetArgValue(path, arg.name, e.target.value)}
                placeholder={`${arg.type}${arg.defaultValue !== undefined ? ` = ${JSON.stringify(arg.defaultValue)}` : ''}`}
                className="h-6 min-w-0 flex-1 font-mono text-xs"
              />
            </div>
          ))}
        </div>
      )}

      {/* Nested fields */}
      {hasChildren && field.expanded && (
        <FieldTree
          fields={field.fields}
          path={path}
          searchFilter={searchFilter}
          onToggleField={onToggleField}
          onToggleExpand={onToggleExpand}
          onSetArgValue={onSetArgValue}
        />
      )}
    </div>
  );
}
