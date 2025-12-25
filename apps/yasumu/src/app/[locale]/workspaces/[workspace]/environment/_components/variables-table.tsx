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
import { Trash, Plus } from 'lucide-react';
import { Button } from '@yasumu/ui/components/button';
import { Checkbox } from '@yasumu/ui/components/checkbox';

import { Variable } from '../../../_stores/environment-store';

interface VariablesTableProps {
  variables: Variable[];
  onChange: (variables: Variable[]) => void;
}

export default function VariablesTable({
  variables,
  onChange,
}: VariablesTableProps) {
  const updateVariable = (
    index: number,
    field: keyof Variable,
    value: string | boolean,
  ) => {
    const updated = variables.map((v, i) =>
      i === index ? { ...v, [field]: value } : v,
    );
    onChange(updated);
  };

  const addVariable = () => {
    onChange([...variables, { key: '', value: '', enabled: true }]);
  };

  const deleteVariable = (index: number) => {
    if (variables.length > 1) {
      onChange(variables.filter((_, i) => i !== index));
    } else {
      onChange([{ key: '', value: '', enabled: true }]);
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
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variables.map((variable, index) => (
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
                  disabled={variables.length === 1}
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
        onClick={addVariable}
        className="text-sm p-0 h-auto font-normal"
      >
        <Plus className="mr-1 h-3 w-3" /> Add new variable
      </Button>
    </div>
  );
}
