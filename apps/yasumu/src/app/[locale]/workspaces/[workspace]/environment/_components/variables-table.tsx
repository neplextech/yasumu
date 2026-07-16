'use client';

import type { Environment, TabularPair } from '@yasumu/core';
import { Button } from '@yasumu/ui/components/button';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import { Input } from '@yasumu/ui/components/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@yasumu/ui/components/table';
import { Plus, Save, Trash } from 'lucide-react';
import { useEffect, useRef, useState, type ClipboardEvent } from 'react';

import { useStableRowKeys } from '@/components/tables/use-stable-row-keys';

import { parseEnvFormat } from './shared/env-parser';

interface VariablesTableProps {
  environment: Environment;
  variables: TabularPair[];
  onSave: (environment: Environment, variables: TabularPair[]) => void;
}

export default function VariablesTable({ environment, variables, onSave }: VariablesTableProps) {
  const [localVariables, setLocalVariables] = useState<TabularPair[]>(variables);
  const previousVariablesRef = useRef(variables);
  const { rowKeys, insertKey, insertKeys, removeKey, resetKeys } = useStableRowKeys(variables.length);

  useEffect(() => {
    if (previousVariablesRef.current === variables) return;

    previousVariablesRef.current = variables;
    setLocalVariables(variables);
    resetKeys(variables.length);
  }, [resetKeys, variables]);

  const updateVariable = (index: number, field: keyof TabularPair, value: string | boolean) => {
    const updated = localVariables.map((v, i) => (i === index ? { ...v, [field]: value } : v));
    setLocalVariables(updated);
  };

  const addVariable = () => {
    insertKey(localVariables.length);
    const updated = [...localVariables, { key: '', value: '', enabled: true }];
    setLocalVariables(updated);
  };

  const deleteVariable = (index: number) => {
    if (localVariables.length > 1) {
      removeKey(index);
      const updated = localVariables.filter((_, i) => i !== index);
      setLocalVariables(updated);
    } else {
      resetKeys(1);
      const updated = [{ key: '', value: '', enabled: true }];
      setLocalVariables(updated);
    }
  };

  const handleSave = () => {
    onSave(environment, localVariables);
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    const parsed = parseEnvFormat(pastedText);
    if (parsed.length === 0) return;

    const existingKeys = new Set(localVariables.map((v) => v.key.trim().toLowerCase()));
    const newPairs = parsed.filter((p) => !existingKeys.has(p.key.trim().toLowerCase()));

    if (newPairs.length > 0) {
      insertKeys(localVariables.length, newPairs.length);
      const updated = [...localVariables, ...newPairs];
      setLocalVariables(updated);
    }
  };

  return (
    <div className="space-y-4" onPaste={handlePaste}>
      <Table className="border" aria-label="Environment variables">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Enabled</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Value</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {localVariables.map((variable, index) => {
            const variableLabel = variable.key.trim() || `row ${index + 1}`;

            return (
              <TableRow key={rowKeys[index]}>
                <TableCell>
                  <Checkbox
                    aria-label={`Enabled for variable ${variableLabel}`}
                    checked={variable.enabled}
                    onCheckedChange={(checked) => updateVariable(index, 'enabled', checked === true)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    aria-label={`Variable name for row ${index + 1}`}
                    placeholder="Variable name"
                    value={variable.key}
                    onChange={(e) => updateVariable(index, 'key', e.target.value)}
                    disabled={!variable.enabled}
                    className="font-mono"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    aria-label={`Value for variable ${variableLabel}`}
                    placeholder="Variable value"
                    value={variable.value}
                    onChange={(e) => updateVariable(index, 'value', e.target.value)}
                    disabled={!variable.enabled}
                    className="font-mono"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteVariable(index)}
                    disabled={localVariables.length === 1}
                    aria-label={`Delete variable ${variableLabel}`}
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
        <Button variant="link" onClick={addVariable} className="h-auto p-0 text-sm font-normal">
          <Plus data-icon="inline-start" aria-hidden="true" /> Add new variable
        </Button>
        <Button onClick={handleSave}>
          <Save data-icon="inline-start" aria-hidden="true" />
          Save
        </Button>
      </div>
    </div>
  );
}
