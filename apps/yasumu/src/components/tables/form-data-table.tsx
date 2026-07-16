'use client';

import type { YasumuFileReference } from '@yasumu/core';
import { Button } from '@yasumu/ui/components/button';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import { Input } from '@yasumu/ui/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@yasumu/ui/components/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@yasumu/ui/components/table';
import { Plus, Trash } from 'lucide-react';

import { InteropableInput, useVariablePopover } from '@/components/inputs';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { registerFileReference } from '@/lib/files/file-reference';

import { useStableRowKeys } from './use-stable-row-keys';

export interface FormDataPair {
  key: string;
  kind: 'text' | 'file';
  value?: string;
  file?: YasumuFileReference;
  enabled: boolean;
}

const EMPTY_PAIR: FormDataPair = { key: '', value: '', kind: 'text', enabled: true };

export default function FormDataTable({
  onChange,
  pairs: providedPairs,
}: {
  onChange?: (pairs: FormDataPair[]) => void;
  pairs?: FormDataPair[];
}) {
  const { renderVariablePopover } = useVariablePopover();
  const workspace = useActiveWorkspace();
  const pairs = providedPairs?.length ? providedPairs : [EMPTY_PAIR];
  const { rowKeys, insertKey, removeKey } = useStableRowKeys(pairs.length);

  const addPair = (index = pairs.length) => {
    insertKey(index);
    onChange?.([...pairs.slice(0, index), { ...EMPTY_PAIR }, ...pairs.slice(index)]);
  };
  const deletePair = (index: number) => {
    if (pairs.length > 1) removeKey(index);
    const nextPairs = pairs.filter((_, pairIndex) => pairIndex !== index);
    onChange?.(nextPairs.length ? nextPairs : [{ ...EMPTY_PAIR }]);
  };
  const updatePair = (index: number, updates: Partial<FormDataPair>) => {
    onChange?.(
      pairs.map((pair, pairIndex) => {
        if (pairIndex !== index) return pair;
        if (updates.kind && updates.kind !== pair.kind) {
          return updates.kind === 'file'
            ? { key: pair.key, enabled: pair.enabled, kind: 'file' }
            : { key: pair.key, enabled: pair.enabled, kind: 'text', value: '' };
        }
        return { ...pair, ...updates };
      }),
    );
  };

  return (
    <div className="space-y-4">
      <Table className="rounded-md border">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]">
              <span className="sr-only">Enabled</span>
            </TableHead>
            <TableHead className="w-[200px]">Key</TableHead>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className="w-[50px]">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pairs.map((pair, index) => (
            <TableRow
              key={rowKeys[index]}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault();
                  addPair(index + 1);
                } else if (event.key === 'd' && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault();
                  deletePair(index);
                }
              }}
            >
              <TableCell>
                <Checkbox
                  aria-label={`${pair.enabled ? 'Disable' : 'Enable'} form-data row ${index + 1}`}
                  checked={pair.enabled}
                  onCheckedChange={(checked) => updatePair(index, { enabled: checked === true })}
                />
              </TableCell>
              <TableCell>
                <InteropableInput
                  aria-label={`Key for form-data row ${index + 1}`}
                  placeholder="Key"
                  value={pair.key}
                  onChange={(key) => updatePair(index, { key })}
                  onVariableClick={renderVariablePopover}
                  disabled={!pair.enabled}
                />
              </TableCell>
              <TableCell>
                <Select
                  value={pair.kind}
                  onValueChange={(kind) => {
                    if (kind === 'text' || kind === 'file') updatePair(index, { kind });
                  }}
                  disabled={!pair.enabled}
                >
                  <SelectTrigger aria-label={`Value type for form-data row ${index + 1}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {pair.kind === 'file' ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      aria-label={`File value for ${pair.key || `form-data row ${index + 1}`}`}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void registerFileReference(file, workspace.execution).then((reference) =>
                            updatePair(index, { file: reference }),
                          );
                        }
                      }}
                      disabled={!pair.enabled}
                      className="cursor-pointer"
                    />
                    {pair.file ? (
                      <span className="text-muted-foreground text-xs whitespace-nowrap">
                        {pair.file.name} ({pair.file.size ?? 0} bytes)
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <InteropableInput
                    aria-label={`Value for ${pair.key || `form-data row ${index + 1}`}`}
                    placeholder="Value"
                    value={pair.value ?? ''}
                    onChange={(value) => updatePair(index, { value })}
                    onVariableClick={renderVariablePopover}
                    disabled={!pair.enabled}
                  />
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete form-data row ${index + 1}`}
                  onClick={() => deletePair(index)}
                  disabled={pairs.length === 1}
                >
                  <Trash className="text-destructive size-4" aria-hidden="true" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button variant="link" onClick={() => addPair()} className="h-auto p-0 text-sm font-normal">
        <Plus className="mr-1 size-3" aria-hidden="true" /> Add new row
      </Button>
    </div>
  );
}
