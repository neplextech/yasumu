'use client';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yasumu/ui/components/select';
import {
  InteropableInput,
  useVariablePopover,
} from '@/components/inputs';

export interface FormDataPair {
  key: string;
  value: string | File;
  type: 'text' | 'file';
  enabled: boolean;
}

export default function FormDataTable(props: {
  onChange?: (pairs: FormDataPair[]) => void;
  pairs?: FormDataPair[];
}) {
  const { renderVariablePopover } = useVariablePopover();
  // We use local state to handle updates immediately for UI,
  // but we rely on the parent to pass the "saved" state back if needed,
  // or we can just be controlled.
  // Given the requirement for debouncing in the parent, this component should probably be controlled
  // but efficient.
  // However, since we are inside BodyEditor which will manage state,
  // we can treat this as a controlled component where `pairs` comes from BodyEditor's local state.

  const pairs = props.pairs?.length
    ? props.pairs
    : [{ key: '', value: '', type: 'text' as const, enabled: true }];

  const updatePairs = (newPairs: FormDataPair[]) => {
    props.onChange?.(newPairs);
  };

  const addNewPair = (index = pairs.length) => {
    const newPairs = [
      ...pairs.slice(0, index),
      { key: '', value: '', type: 'text' as const, enabled: true },
      ...pairs.slice(index),
    ];
    updatePairs(newPairs);
  };

  const deletePair = (index: number) => {
    const newPairs = pairs.filter((_, i) => i !== index);
    updatePairs(
      newPairs.length
        ? newPairs
        : [{ key: '', value: '', type: 'text' as const, enabled: true }],
    );
  };

  const updatePair = (index: number, field: keyof FormDataPair, value: any) => {
    const newPairs = pairs.map((pair, i) => {
      if (i !== index) return pair;
      if (field === 'type') {
        // Reset value if type changes
        return { ...pair, type: value, value: '' };
      }
      return { ...pair, [field]: value };
    });
    updatePairs(newPairs);
  };

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      addNewPair(index + 1);
    }
    if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      deletePair(index);
    }
  }

  return (
    <div className="space-y-4">
      <Table className="border rounded-md">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30px]"></TableHead>
            <TableHead className="w-[200px]">Key</TableHead>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className="w-[50px]"></TableHead>
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
                <Checkbox
                  checked={pair.enabled}
                  onCheckedChange={(checked) =>
                    updatePair(i, 'enabled', checked === true)
                  }
                />
              </TableCell>
              <TableCell>
                <InteropableInput
                  placeholder="Key"
                  value={pair.key}
                  onChange={(val) => updatePair(i, 'key', val)}
                  onVariableClick={renderVariablePopover}
                  disabled={!pair.enabled}
                />
              </TableCell>
              <TableCell>
                <Select
                  value={pair.type}
                  onValueChange={(val) => updatePair(i, 'type', val)}
                  disabled={!pair.enabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {pair.type === 'file' ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) updatePair(i, 'value', file);
                      }}
                      disabled={!pair.enabled}
                      className="cursor-pointer"
                    />
                    {pair.value instanceof File && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {pair.value.size} bytes
                      </span>
                    )}
                  </div>
                ) : (
                  <InteropableInput
                    placeholder="Value"
                    value={typeof pair.value === 'string' ? pair.value : ''}
                    onChange={(val) => updatePair(i, 'value', val)}
                    onVariableClick={renderVariablePopover}
                    disabled={!pair.enabled}
                  />
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deletePair(i)}
                  disabled={pairs.length === 1}
                >
                  <Trash className="h-4 w-4 text-red-500" />
                </Button>
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
