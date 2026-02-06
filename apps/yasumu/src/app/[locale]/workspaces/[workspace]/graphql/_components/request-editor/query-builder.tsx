'use client';

import { useCallback, useState, useMemo } from 'react';
import { Button } from '@yasumu/ui/components/button';
import { Input } from '@yasumu/ui/components/input';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Badge } from '@yasumu/ui/components/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Search,
  Braces,
} from 'lucide-react';
import { cn } from '@yasumu/ui/lib/utils';
import type {
  FieldNode,
  RootOperation,
} from '../../_hooks/use-query-builder';

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
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 shrink-0 pb-2 border-b">
        <Tabs
          value={activeOperation}
          onValueChange={(v) =>
            onActiveOperationChange(v as 'query' | 'mutation' | 'subscription')
          }
        >
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
        </Tabs>
        <div className="flex-1" />
        <div className="relative w-48">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter fields..."
            className="h-8 text-xs pl-7"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* Field explorer */}
        <ScrollArea className="flex-1 p-2">
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
        </ScrollArea>

        {/* Generated query preview */}
        <div className="w-[40%] border-l flex flex-col min-h-0">
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
      </div>
    </div>
  );
}

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
    <div className="space-y-0.5">
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
  const depth = path.length;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1.5 py-1 px-1 rounded-sm hover:bg-muted/50 group',
          field.selected && 'bg-primary/5',
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
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
          <div className="w-4" />
        )}

        <Checkbox
          checked={field.selected}
          onCheckedChange={() => onToggleField(path)}
          className="h-3.5 w-3.5"
        />

        <span
          className={cn(
            'text-xs font-mono',
            field.selected ? 'text-foreground font-medium' : 'text-muted-foreground',
          )}
        >
          {field.name}
        </span>

        <Badge
          variant="outline"
          className="text-[10px] px-1 py-0 h-4 font-mono text-muted-foreground/70"
        >
          {field.type}
        </Badge>

        {field.description && (
          <span className="text-[10px] text-muted-foreground/50 truncate max-w-[200px]">
            {field.description}
          </span>
        )}
      </div>

      {/* Inline argument inputs when field is selected */}
      {field.selected && field.args.length > 0 && (
        <div
          className="space-y-1 py-1"
          style={{ paddingLeft: `${depth * 16 + 32}px` }}
        >
          {field.args.map((arg) => (
            <div key={arg.name} className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground min-w-[80px]">
                {arg.name}
                {arg.required && (
                  <span className="text-destructive">*</span>
                )}
              </span>
              <Input
                value={field.argValues[arg.name] ?? ''}
                onChange={(e) =>
                  onSetArgValue(path, arg.name, e.target.value)
                }
                placeholder={`${arg.type}${arg.defaultValue !== undefined ? ` = ${JSON.stringify(arg.defaultValue)}` : ''}`}
                className="h-6 text-xs font-mono flex-1 max-w-[200px]"
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
