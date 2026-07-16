'use client';

import { Button } from '@yasumu/ui/components/button';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@yasumu/ui/components/table';
import { Plus, Trash } from 'lucide-react';

import { InteropableInput, useVariablePopover } from '@/components/inputs';

import { useStableRowKeys } from './use-stable-row-keys';

export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
  onChange?: (pair: KeyValuePair) => void;
}

const EMPTY_PAIR: KeyValuePair = { key: '', value: '', enabled: true };

export default function KeyValueTable({
  onChange,
  pairs: providedPairs,
}: {
  onChange?: (pairs: KeyValuePair[]) => void;
  pairs?: KeyValuePair[];
}) {
  const { renderVariablePopover } = useVariablePopover();
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
  const updatePair = (index: number, updates: Partial<KeyValuePair>) => {
    onChange?.(pairs.map((pair, pairIndex) => (pairIndex === index ? { ...pair, ...updates } : pair)));
  };

  return (
    <div className="space-y-4">
      <Table className="border">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Actions</TableHead>
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
                } else if (event.key === 't' && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault();
                  updatePair(index, { enabled: !pair.enabled });
                }
              }}
            >
              <TableCell>
                <InteropableInput
                  aria-label={`Name for row ${index + 1}`}
                  placeholder="Name"
                  value={pair.key}
                  onChange={(key) => updatePair(index, { key })}
                  onVariableClick={renderVariablePopover}
                  disabled={!pair.enabled}
                />
              </TableCell>
              <TableCell>
                <InteropableInput
                  aria-label={`Value for ${pair.key || `row ${index + 1}`}`}
                  placeholder="Value"
                  value={pair.value}
                  onChange={(value) => updatePair(index, { value })}
                  onVariableClick={renderVariablePopover}
                  disabled={!pair.enabled}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    aria-label={`${pair.enabled ? 'Disable' : 'Enable'} row ${index + 1}`}
                    checked={pair.enabled}
                    onCheckedChange={(checked) => updatePair(index, { enabled: checked === true })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete row ${index + 1}`}
                    onClick={() => deletePair(index)}
                    disabled={pairs.length === 1}
                  >
                    <Trash className="text-destructive size-4" aria-hidden="true" />
                  </Button>
                </div>
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
