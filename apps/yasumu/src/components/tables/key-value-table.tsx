/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useRef, useState } from 'react';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import { Input } from '@yasumu/ui/components/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@yasumu/ui/components/table';
import { Trash, Plus } from 'lucide-react';
import { Button } from '@yasumu/ui/components/button';
import { flushSync } from 'react-dom';

export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

export default function KeyValueTable(props: {
  onChange?: (pairs: KeyValuePair[]) => void;
  pairs?: KeyValuePair[];
}) {
  const inputRefs = useRef<Array<HTMLInputElement>>([]);
  const pairs = props.pairs?.length
    ? props.pairs
    : [{ key: '', value: '', enabled: true }];

  const updatePairs = (newPairs: KeyValuePair[]) => {
    props.onChange?.(newPairs);
  };

  const addNewPair = (index = pairs.length) => {
    const newPairs = [
      ...pairs.slice(0, index),
      { key: '', value: '', enabled: true },
      ...pairs.slice(index),
    ];
    updatePairs(newPairs);
  };

  const deletePair = (index: number) => {
    const newPairs = pairs.filter((_, i) => i !== index);
    updatePairs(
      newPairs.length ? newPairs : [{ key: '', value: '', enabled: true }],
    );
  };

  const updatePair = (
    index: number,
    field: keyof KeyValuePair,
    value: string | boolean,
  ) => {
    const newPairs = pairs.map((pair, i) =>
      i === index ? { ...pair, [field]: value } : pair,
    );
    updatePairs(newPairs);
  };

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      flushSync(() => {
        addNewPair(index + 1);
      });

      if (inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
    if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      deletePair(index);
      const isLastIndex = index === pairs.length - 1;
      if (isLastIndex && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }

    if (e.key === 't' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      updatePair(index, 'enabled', !pairs[index].enabled);
    }
  }

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
          {pairs.map((pair, i) => (
            <TableRow
              key={i}
              onKeyDown={(e) => {
                handleKeyDown(e, i);
              }}
            >
              <TableCell>
                <Input
                  ref={(el) => {
                    if (el) inputRefs.current[i] = el;
                  }}
                  placeholder="Name"
                  value={pair.key}
                  onChange={(e) => updatePair(i, 'key', e.target.value)}
                  disabled={!pair.enabled}
                />
              </TableCell>
              <TableCell>
                <Input
                  placeholder="Value"
                  value={pair.value}
                  onChange={(e) => updatePair(i, 'value', e.target.value)}
                  disabled={!pair.enabled}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={pair.enabled}
                    onCheckedChange={(checked) =>
                      updatePair(i, 'enabled', checked === true)
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deletePair(i)}
                    disabled={pairs.length === 1}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button
        variant="link"
        onClick={() => addNewPair()}
        className="text-sm p-0 h-auto font-normal"
      >
        <Plus className="mr-1 h-3 w-3" /> Add new row
      </Button>
    </div>
  );
}
