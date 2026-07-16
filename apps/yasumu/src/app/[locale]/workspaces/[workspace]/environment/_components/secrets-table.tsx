'use client';

import type { Environment, TabularPair } from '@yasumu/core';
import { Button } from '@yasumu/ui/components/button';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import { Input } from '@yasumu/ui/components/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@yasumu/ui/components/table';
import { Eye, EyeOff, Plus, Save, Trash } from 'lucide-react';
import { useEffect, useRef, useState, type ClipboardEvent } from 'react';

import { useStableRowKeys } from '@/components/tables/use-stable-row-keys';

import { parseEnvFormat } from './shared/env-parser';

interface SecretsTableProps {
  environment: Environment;
  secrets: TabularPair[];
  onSave: (environment: Environment, secrets: TabularPair[]) => void;
}

export default function SecretsTable({ environment, secrets, onSave }: SecretsTableProps) {
  const [localSecrets, setLocalSecrets] = useState<TabularPair[]>(secrets);
  const previousSecretsRef = useRef(secrets);
  const { rowKeys, insertKey, insertKeys, removeKey, resetKeys } = useStableRowKeys(secrets.length);
  const [visibleRowKeys, setVisibleRowKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (previousSecretsRef.current === secrets) return;

    previousSecretsRef.current = secrets;
    setLocalSecrets(secrets);
    resetKeys(secrets.length);
    setVisibleRowKeys(new Set());
  }, [resetKeys, secrets]);

  const toggleVisibility = (rowKey: string) => {
    setVisibleRowKeys((current) => {
      const next = new Set(current);
      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }
      return next;
    });
  };

  const updateSecret = (index: number, field: keyof TabularPair, value: string | boolean) => {
    const updated = localSecrets.map((s, i) => (i === index ? { ...s, [field]: value } : s));
    setLocalSecrets(updated);
  };

  const addSecret = () => {
    insertKey(localSecrets.length);
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
    const rowKey = rowKeys[index];

    if (localSecrets.length > 1) {
      removeKey(index);
      setVisibleRowKeys((current) => {
        const next = new Set(current);
        next.delete(rowKey);
        return next;
      });

      const updated = localSecrets.filter((_, i) => i !== index);
      setLocalSecrets(updated);
    } else {
      resetKeys(1);
      setVisibleRowKeys(new Set());
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

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    const parsed = parseEnvFormat(pastedText);
    if (parsed.length === 0) return;

    const existingKeys = new Set(localSecrets.map((s) => s.key.trim().toLowerCase()));
    const newPairs = parsed.filter((p) => !existingKeys.has(p.key.trim().toLowerCase()));

    if (newPairs.length > 0) {
      insertKeys(localSecrets.length, newPairs.length);
      const updated = [...localSecrets, ...newPairs];
      setLocalSecrets(updated);
    }
  };

  return (
    <div className="space-y-4" onPaste={handlePaste}>
      <Table className="border" aria-label="Environment secrets">
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
            const rowKey = rowKeys[index];
            const isVisible = visibleRowKeys.has(rowKey);
            const secretLabel = secret.key.trim() || `row ${index + 1}`;

            return (
              <TableRow key={rowKey}>
                <TableCell>
                  <Checkbox
                    aria-label={`Enabled for secret ${secretLabel}`}
                    checked={secret.enabled}
                    onCheckedChange={(checked) => updateSecret(index, 'enabled', checked === true)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    aria-label={`Secret name for row ${index + 1}`}
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
                      aria-label={`Value for secret ${secretLabel}`}
                      type={isVisible ? 'text' : 'password'}
                      placeholder="Secret value"
                      value={secret.value}
                      onChange={(e) => updateSecret(index, 'value', e.target.value)}
                      disabled={!secret.enabled}
                      className="font-mono"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleVisibility(rowKey)}
                      disabled={!secret.enabled}
                      aria-label={`${isVisible ? 'Hide' : 'Show'} value for secret ${secretLabel}`}
                      aria-pressed={isVisible}
                    >
                      {isVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSecret(index)}
                    aria-label={`Delete secret ${secretLabel}`}
                  >
                    <Trash className="text-destructive" aria-hidden="true" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between">
        <Button variant="link" onClick={addSecret} className="h-auto p-0 text-sm font-normal">
          <Plus data-icon="inline-start" aria-hidden="true" /> Add new secret
        </Button>
        <Button onClick={handleSave}>
          <Save data-icon="inline-start" aria-hidden="true" />
          Save
        </Button>
      </div>
    </div>
  );
}
