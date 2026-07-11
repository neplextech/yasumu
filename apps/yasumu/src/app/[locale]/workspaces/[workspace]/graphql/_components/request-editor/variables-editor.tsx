'use client';

import { Button } from '@yasumu/ui/components/button';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import { Input } from '@yasumu/ui/components/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@yasumu/ui/components/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@yasumu/ui/components/tabs';
import { Trash, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { TextEditor } from '@/components/editors';

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

  const handleTableChange = useCallback(
    (newEntries: VariableEntry[]) => {
      setEntries(newEntries);
      onChange(entriesToJson(newEntries));
    },
    [onChange],
  );

  const handleJsonChange = useCallback(
    (json: string) => {
      onChange(json);
      // Sync table entries from JSON when switching
      setEntries(parseVariablesToEntries(json));
    },
    [onChange],
  );

  const handleModeSwitch = useCallback(
    (newMode: string) => {
      if (newMode === 'table') {
        setEntries(parseVariablesToEntries(variables));
      }
      setMode(newMode as 'table' | 'json');
    },
    [variables],
  );

  const addEntry = useCallback(() => {
    handleTableChange([...entries, { key: '', value: '', enabled: true }]);
  }, [entries, handleTableChange]);

  const removeEntry = useCallback(
    (index: number) => {
      const newEntries = entries.filter((_, i) => i !== index);
      handleTableChange(newEntries.length ? newEntries : [{ key: '', value: '', enabled: true }]);
    },
    [entries, handleTableChange],
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
          <Table className="border">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">On</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Checkbox
                      checked={entry.enabled}
                      onCheckedChange={(checked) => updateEntry(index, 'enabled', checked === true)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={entry.key}
                      onChange={(e) => updateEntry(index, 'key', e.target.value)}
                      placeholder="key"
                      className="h-8 font-mono text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={entry.value}
                      onChange={(e) => updateEntry(index, 'value', e.target.value)}
                      placeholder="value"
                      className="h-8 font-mono text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeEntry(index)}>
                      <Trash className="text-muted-foreground h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="outline" size="sm" onClick={addEntry} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
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
