/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useState } from 'react';
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

interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

export default function KeyValueTable({ value = {} }: { value?: any }) {
  const [pairs, setPairs] = useState<KeyValuePair[]>(() => {
    const initialPairs = Object.values(value) as KeyValuePair[];

    return initialPairs.length
      ? initialPairs
      : [{ key: '', value: '', enabled: true }];
  });

  const onChange = useCallback((newValue: any) => {
    updatePairs(newValue);
  }, []);

  const updatePairs = (newPairs: KeyValuePair[]) => {
    setPairs(newPairs);
    const newValue = newPairs.reduce(
      (acc, { key, value, enabled }) => {
        if (enabled && key) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, any>,
    );
    onChange(newValue);
  };

  const addNewPair = () => {
    updatePairs([...pairs, { key: '', value: '', enabled: true }]);
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
            <TableRow key={i}>
              <TableCell>
                <Input
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
        onClick={addNewPair}
        className="text-sm p-0 h-auto font-normal"
      >
        <Plus className="mr-1 h-3 w-3" /> Add new row
      </Button>
    </div>
  );
}
