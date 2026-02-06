'use client';

import { useCallback, useState } from 'react';
import { Button } from '@yasumu/ui/components/button';
import { Input } from '@yasumu/ui/components/input';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@yasumu/ui/components/tabs';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@yasumu/ui/components/hover-card';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@yasumu/ui/components/resizable';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Search,
  Braces,
  Info,
} from 'lucide-react';
import { cn } from '@yasumu/ui/lib/utils';
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
      <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4">
        <Braces className="h-12 w-12 text-muted-foreground/30" />
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            No schema available
          </p>
          <p className="text-xs text-muted-foreground/70">
            Click &quot;Introspect&quot; to fetch the schema from your GraphQL
            endpoint, then use the query builder to construct queries visually.
          </p>
        </div>
      </div>
    );
  }

  const availableOps = operations.map((op) => op.type);

  return (
    <Tabs
      value={activeOperation}
      onValueChange={(v) =>
        onActiveOperationChange(v as 'query' | 'mutation' | 'subscription')
      }
      className="flex flex-col h-full min-h-0 overflow-hidden"
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 shrink-0 pb-2 border-b">
        <TabsList className="h-8">
          {availableOps.map((op) => (
            <TabsTrigger
              key={op}
              value={op}
              className="text-xs px-3 h-6 capitalize"
            >
              {op}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex-1" />
        <div className="relative w-44">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter fields..."
            className="h-8 text-xs pl-7"
          />
        </div>
      </div>

      {/* Resizable split: fields explorer | query preview */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={60} minSize={30}>
            <ScrollArea className="h-full">
              <div className="p-2">
                {currentOperation && (
                  <FieldTree
                    fields={currentOperation.fields}
                    path={[]}
                    searchFilter={searchFilter.toLowerCase()}
                    onToggleField={onToggleField}
                    onToggleExpand={onToggleExpand}
                    onSetArgValue={onSetArgValue}
                  />
                )}
              </div>
            </ScrollArea>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={40} minSize={20}>
            <div className="flex flex-col h-full min-h-0">
              <div className="flex items-center justify-between px-3 py-2 border-b shrink-0">
                <span className="text-xs text-muted-foreground font-medium">
                  Generated Query
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCopy}
                    disabled={!generatedQuery}
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={handleApply}
                    disabled={!generatedQuery}
                  >
                    Apply
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <pre className="p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                  {generatedQuery || '# Select fields to build a query'}
                </pre>
              </ScrollArea>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Tabs>
  );
}

// ─── Field documentation hover card (VS Code-like) ──────────────────────────

function FieldDocCard({ field }: { field: FieldNode }) {
  const hasArgs = field.args.length > 0;
  const hasChildren = field.fields.length > 0;

  // Build a signature like: fieldName(arg1: Type!, arg2: Type): ReturnType
  const signature = hasArgs
    ? `${field.name}(${field.args.map((a) => `${a.name}: ${a.type}`).join(', ')}): ${field.type}`
    : `${field.name}: ${field.type}`;

  return (
    <div className="max-w-xs space-y-2">
      {/* Signature */}
      <div className="font-mono text-xs text-foreground bg-muted/50 rounded px-2 py-1.5 break-all leading-relaxed">
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
      {field.description && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {field.description}
        </p>
      )}

      {/* Parameters */}
      {hasArgs && (
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
            Parameters
          </div>
          <div className="space-y-0.5">
            {field.args.map((arg) => (
              <div key={arg.name} className="flex gap-1.5 text-xs">
                <span className="font-mono text-foreground shrink-0">
                  {arg.name}
                  {arg.required && <span className="text-destructive">*</span>}
                </span>
                <span className="font-mono text-blue-400 shrink-0">
                  {arg.type}
                </span>
                {arg.description && (
                  <span className="text-muted-foreground/70 truncate">
                    &mdash; {arg.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Return type info */}
      <div className="flex items-center gap-1.5 text-xs pt-0.5 border-t border-border/50">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
          Returns
        </span>
        <span className="font-mono text-green-400">{field.type}</span>
        {hasChildren && (
          <span className="text-muted-foreground/50">
            ({field.fields.length} fields)
          </span>
        )}
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
        const matchesSearch =
          !searchFilter || field.name.toLowerCase().includes(searchFilter);

        const childMatches = field.fields.some((f) =>
          f.name.toLowerCase().includes(searchFilter),
        );

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
    <div className="min-w-0 w-full">
      <div
        className={cn(
          'flex items-center gap-1 py-0.5 rounded-sm hover:bg-muted/50 group min-w-0',
          field.selected && 'bg-primary/5',
        )}
        style={{ paddingLeft: `${depth * 14 + 4}px`, paddingRight: 4 }}
      >
        {/* Expand/collapse chevron */}
        {hasChildren ? (
          <button
            onClick={() => onToggleExpand(path)}
            className="p-0.5 rounded hover:bg-muted shrink-0"
          >
            {field.expanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
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
            field.selected
              ? 'text-foreground font-medium'
              : 'text-muted-foreground',
          )}
        >
          {field.name}
        </span>

        {/* Spacer */}
        <div className="flex-1 shrink-0" />

        {/* Docs hover card trigger */}
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>
            <button className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity shrink-0">
              <Info className="h-3 w-3 text-muted-foreground/60" />
            </button>
          </HoverCardTrigger>
          <HoverCardContent
            side="right"
            align="start"
            sideOffset={8}
            className="p-3 w-full"
          >
            <FieldDocCard field={field} />
          </HoverCardContent>
        </HoverCard>
      </div>

      {/* Inline argument inputs when field is selected */}
      {field.selected && hasArgs && (
        <div
          className="py-1 space-y-1"
          style={{ paddingLeft: `${depth * 14 + 34}px`, paddingRight: 8 }}
        >
          {field.args.map((arg) => (
            <div key={arg.name} className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                {arg.name}
                {arg.required && <span className="text-destructive">*</span>}
              </span>
              <Input
                value={field.argValues[arg.name] ?? ''}
                onChange={(e) => onSetArgValue(path, arg.name, e.target.value)}
                placeholder={`${arg.type}${arg.defaultValue !== undefined ? ` = ${JSON.stringify(arg.defaultValue)}` : ''}`}
                className="h-6 text-xs font-mono flex-1 min-w-0"
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
