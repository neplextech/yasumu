'use client';

import { useState } from 'react';
import { Input } from '@yasumu/ui/components/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@yasumu/ui/components/table';
import { Trash, Plus, Eye, EyeOff } from 'lucide-react';
import { Button } from '@yasumu/ui/components/button';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import { Variable } from '../../../_stores/environment-store';

interface SecretsTableProps {
  secrets: Variable[];
  onChange: (secrets: Variable[]) => void;
}

export default function SecretsTable({ secrets, onChange }: SecretsTableProps) {
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());

  const toggleVisibility = (index: number) => {
    const newVisible = new Set(visibleIndices);
    if (newVisible.has(index)) {
      newVisible.delete(index);
    } else {
      newVisible.add(index);
    }
    setVisibleIndices(newVisible);
  };

  const updateSecret = (
    index: number,
    field: keyof Variable,
    value: string | boolean,
  ) => {
    const updated = secrets.map((s, i) =>
      i === index ? { ...s, [field]: value } : s,
    );
    onChange(updated);
  };

  const addSecret = () => {
    onChange([
      ...secrets,
      {
        key: '',
        value: '',
        enabled: true,
      },
    ]);
  };

  const deleteSecret = (index: number) => {
    if (secrets.length > 1) {
      // Adjust visible indices
      const newVisible = new Set<number>();
      visibleIndices.forEach((idx) => {
        if (idx < index) newVisible.add(idx);
        if (idx > index) newVisible.add(idx - 1);
      });
      setVisibleIndices(newVisible);

      onChange(secrets.filter((_, i) => i !== index));
    } else {
      setVisibleIndices(new Set());
      onChange([
        {
          key: '',
          value: '',
          enabled: true,
        },
      ]);
    }
  };

  return (
    <div className="space-y-4">
      <Table className="border">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Enabled</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {secrets.map((secret, index) => {
            const isVisible = visibleIndices.has(index);
            return (
              <TableRow key={index}>
                <TableCell>
                  <Checkbox
                    checked={secret.enabled}
                    onCheckedChange={(checked) =>
                      updateSecret(index, 'enabled', checked === true)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Secret name"
                    value={secret.key}
                    onChange={(e) => updateSecret(index, 'key', e.target.value)}
                    disabled={!secret.enabled}
                    className="font-mono"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input
                      type={isVisible ? 'text' : 'password'}
                      placeholder="Secret value"
                      value={secret.value}
                      onChange={(e) =>
                        updateSecret(index, 'value', e.target.value)
                      }
                      disabled={!secret.enabled}
                      className="font-mono"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleVisibility(index)}
                      disabled={!secret.enabled}
                    >
                      {isVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSecret(index)}
                    disabled={secrets.length === 1}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Button
        variant="link"
        onClick={addSecret}
        className="text-sm p-0 h-auto font-normal"
      >
        <Plus className="mr-1 h-3 w-3" /> Add new secret
      </Button>
    </div>
  );
}
