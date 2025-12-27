'use client';

import { useState, useEffect } from 'react';
import { Input } from '@yasumu/ui/components/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@yasumu/ui/components/table';
import { Trash, Plus, Eye, EyeOff, Save } from 'lucide-react';
import { Button } from '@yasumu/ui/components/button';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import { Environment, TabularPair } from '@yasumu/core';
import { parseEnvFormat } from './shared/env-parser';

interface SecretsTableProps {
  environment: Environment;
  secrets: TabularPair[];
  onSave: (environment: Environment, secrets: TabularPair[]) => void;
}

export default function SecretsTable({
  environment,
  secrets,
  onSave,
}: SecretsTableProps) {
  const [localSecrets, setLocalSecrets] = useState<TabularPair[]>(secrets);
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    setLocalSecrets(secrets);
  }, [secrets]);

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
    field: keyof TabularPair,
    value: string | boolean,
  ) => {
    const updated = localSecrets.map((s, i) =>
      i === index ? { ...s, [field]: value } : s,
    );
    setLocalSecrets(updated);
  };

  const addSecret = () => {
    const updated = [
      ...localSecrets,
      {
        key: '',
        value: '',
        enabled: true,
      },
    ];
    setLocalSecrets(updated);
  };

  const deleteSecret = (index: number) => {
    if (localSecrets.length > 1) {
      const newVisible = new Set<number>();
      visibleIndices.forEach((idx) => {
        if (idx < index) newVisible.add(idx);
        if (idx > index) newVisible.add(idx - 1);
      });
      setVisibleIndices(newVisible);

      const updated = localSecrets.filter((_, i) => i !== index);
      setLocalSecrets(updated);
    } else {
      setVisibleIndices(new Set());
      const updated = [
        {
          key: '',
          value: '',
          enabled: true,
        },
      ];
      setLocalSecrets(updated);
    }
  };

  const handleSave = () => {
    onSave(environment, localSecrets);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    const parsed = parseEnvFormat(pastedText);
    if (parsed.length === 0) return;

    const existingKeys = new Set(
      localSecrets.map((s) => s.key.trim().toLowerCase()),
    );
    const newPairs = parsed.filter(
      (p) => !existingKeys.has(p.key.trim().toLowerCase()),
    );

    if (newPairs.length > 0) {
      const updated = [...localSecrets, ...newPairs];
      setLocalSecrets(updated);
    }
  };

  return (
    <div className="space-y-4" onPaste={handlePaste}>
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
          {localSecrets.map((secret, index) => {
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
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between">
        <Button
          variant="link"
          onClick={addSecret}
          className="text-sm p-0 h-auto font-normal"
        >
          <Plus className="mr-1 h-3 w-3" /> Add new secret
        </Button>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
}
