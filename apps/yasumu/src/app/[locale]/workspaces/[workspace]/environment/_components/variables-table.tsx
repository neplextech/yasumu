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
import { Trash, Plus, Save } from 'lucide-react';
import { Button } from '@yasumu/ui/components/button';
import { Checkbox } from '@yasumu/ui/components/checkbox';
import { Environment, TabularPair } from '@yasumu/core';
import { parseEnvFormat } from './shared/env-parser';

interface VariablesTableProps {
  environment: Environment;
  variables: TabularPair[];
  onSave: (environment: Environment, variables: TabularPair[]) => void;
}

export default function VariablesTable({
  environment,
  variables,
  onSave,
}: VariablesTableProps) {
  const [localVariables, setLocalVariables] =
    useState<TabularPair[]>(variables);

  useEffect(() => {
    setLocalVariables(variables);
  }, [variables]);

  const updateVariable = (
    index: number,
    field: keyof TabularPair,
    value: string | boolean,
  ) => {
    const updated = localVariables.map((v, i) =>
      i === index ? { ...v, [field]: value } : v,
    );
    setLocalVariables(updated);
  };

  const addVariable = () => {
    const updated = [...localVariables, { key: '', value: '', enabled: true }];
    setLocalVariables(updated);
  };

  const deleteVariable = (index: number) => {
    if (localVariables.length > 1) {
      const updated = localVariables.filter((_, i) => i !== index);
      setLocalVariables(updated);
    } else {
      const updated = [{ key: '', value: '', enabled: true }];
      setLocalVariables(updated);
    }
  };

  const handleSave = () => {
    onSave(environment, localVariables);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText) return;

    const parsed = parseEnvFormat(pastedText);
    if (parsed.length === 0) return;

    const existingKeys = new Set(
      localVariables.map((v) => v.key.trim().toLowerCase()),
    );
    const newPairs = parsed.filter(
      (p) => !existingKeys.has(p.key.trim().toLowerCase()),
    );

    if (newPairs.length > 0) {
      const updated = [...localVariables, ...newPairs];
      setLocalVariables(updated);
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
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {localVariables.map((variable, index) => (
            <TableRow key={index}>
              <TableCell>
                <Checkbox
                  checked={variable.enabled}
                  onCheckedChange={(checked) =>
                    updateVariable(index, 'enabled', checked === true)
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  placeholder="Variable name"
                  value={variable.key}
                  onChange={(e) => updateVariable(index, 'key', e.target.value)}
                  disabled={!variable.enabled}
                  className="font-mono"
                />
              </TableCell>
              <TableCell>
                <Input
                  placeholder="Variable value"
                  value={variable.value}
                  onChange={(e) =>
                    updateVariable(index, 'value', e.target.value)
                  }
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
                >
                  <Trash className="h-4 w-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between">
        <Button
          variant="link"
          onClick={addVariable}
          className="text-sm p-0 h-auto font-normal"
        >
          <Plus className="mr-1 h-3 w-3" /> Add new variable
        </Button>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
}
