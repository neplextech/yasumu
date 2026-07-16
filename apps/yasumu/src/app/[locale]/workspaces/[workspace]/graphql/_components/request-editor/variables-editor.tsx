'use client';

import { Button } from '@yasumu/ui/components/button';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import { Input } from '@yasumu/ui/components/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@yasumu/ui/components/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@yasumu/ui/components/tabs';
import { Trash, Plus } from 'lucide-react';
import { useCallback, useState } from 'react';

import { TextEditor } from '@/components/editors';
import { useStableRowKeys } from '@/components/tables/use-stable-row-keys';

interface VariableEntry {
  key: string;
  value: string;
  enabled: boolean;
}

interface VariablesEditorProps {
  variables: string;
  onChange: (variables: string) => void;
}

function parseVariablesToEntries(json: string): VariableEntry[] {
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return Object.entries(parsed).map(([key, value]) => ({
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
        enabled: true,
      }));
    }
  } catch {
    // Not valid JSON
  }
  return [{ key: '', value: '', enabled: true }];
}

function entriesToJson(entries: VariableEntry[]): string {
  const obj: Record<string, unknown> = {};
  for (const entry of entries) {
    if (entry.enabled && entry.key) {
      try {
        obj[entry.key] = JSON.parse(entry.value);
      } catch {
        obj[entry.key] = entry.value;
      }
    }
  }
  return JSON.stringify(obj, null, 2);
}

export function VariablesEditor({ variables, onChange }: VariablesEditorProps) {
  const [mode, setMode] = useState<'table' | 'json'>('table');
  const [entries, setEntries] = useState<VariableEntry[]>(() => parseVariablesToEntries(variables));
  const { rowKeys, insertKey, removeKey, resetKeys } = useStableRowKeys(entries.length);

  const handleTableChange = useCallback(
    (newEntries: VariableEntry[]) => {
      setEntries(newEntries);
      onChange(entriesToJson(newEntries));
    },
    [onChange],
  );

  const handleJsonChange = useCallback(
    (json: string) => {
      const nextEntries = parseVariablesToEntries(json);
      onChange(json);
      setEntries(nextEntries);
      resetKeys(nextEntries.length);
    },
    [onChange, resetKeys],
  );

  const handleModeSwitch = useCallback(
    (newMode: string) => {
      if (newMode === 'table') {
        const nextEntries = parseVariablesToEntries(variables);
        setEntries(nextEntries);
        resetKeys(nextEntries.length);
      }
      setMode(newMode as 'table' | 'json');
    },
    [resetKeys, variables],
  );

  const addEntry = useCallback(() => {
    insertKey(entries.length);
    handleTableChange([...entries, { key: '', value: '', enabled: true }]);
  }, [entries, handleTableChange, insertKey]);

  const removeEntry = useCallback(
    (index: number) => {
      const newEntries = entries.filter((_, i) => i !== index);
      if (newEntries.length) {
        removeKey(index);
      } else {
        resetKeys(1);
      }
      handleTableChange(newEntries.length ? newEntries : [{ key: '', value: '', enabled: true }]);
    },
    [entries, handleTableChange, removeKey, resetKeys],
  );

  const updateEntry = useCallback(
    (index: number, field: keyof VariableEntry, value: string | boolean) => {
      const newEntries = entries.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry));
      handleTableChange(newEntries);
    },
    [entries, handleTableChange],
  );

  return (
    <Tabs value={mode} onValueChange={handleModeSwitch} className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between">
        <span className="text-muted-foreground text-sm font-medium">Variables</span>
        <TabsList className="h-8">
          <TabsTrigger value="table" className="h-6 px-3 text-xs">
            Table
          </TabsTrigger>
          <TabsTrigger value="json" className="h-6 px-3 text-xs">
            JSON
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="table" className="mt-2 min-h-0 flex-1">
        <div className="space-y-2">
          <Table className="border" aria-label="GraphQL variables">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">On</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, index) => {
                const variableLabel = entry.key.trim() || `row ${index + 1}`;

                return (
                  <TableRow key={rowKeys[index]}>
                    <TableCell>
                      <Checkbox
                        aria-label={`Enabled for GraphQL variable ${variableLabel}`}
                        checked={entry.enabled}
                        onCheckedChange={(checked) => updateEntry(index, 'enabled', checked === true)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        aria-label={`GraphQL variable key for row ${index + 1}`}
                        value={entry.key}
                        onChange={(e) => updateEntry(index, 'key', e.target.value)}
                        placeholder="key"
                        className="h-8 font-mono text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        aria-label={`Value for GraphQL variable ${variableLabel}`}
                        value={entry.value}
                        onChange={(e) => updateEntry(index, 'value', e.target.value)}
                        placeholder="value"
                        className="h-8 font-mono text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => removeEntry(index)}
                        aria-label={`Delete GraphQL variable ${variableLabel}`}
                      >
                        <Trash className="text-muted-foreground" aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Button variant="outline" size="sm" onClick={addEntry} className="gap-1">
            <Plus data-icon="inline-start" aria-hidden="true" />
            Add Variable
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="json" className="mt-2 min-h-0 flex-1">
        <TextEditor
          value={variables}
          onChange={handleJsonChange}
          language="json"
          placeholder={
            <div className="text-muted-foreground ml-2 text-sm font-medium opacity-40">
              <pre className="font-mono text-sm whitespace-pre-wrap">{`{
  "userId": "123",
  "limit": 10
}`}</pre>
            </div>
          }
        />
      </TabsContent>
    </Tabs>
  );
}
