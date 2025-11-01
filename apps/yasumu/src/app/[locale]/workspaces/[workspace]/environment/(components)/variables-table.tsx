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

interface Variable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface VariablesTableProps {
  variables: Variable[];
  onChange: (variables: Variable[]) => void;
}

export default function VariablesTable({
  variables,
  onChange,
}: VariablesTableProps) {
  const updateVariable = (
    id: string,
    field: keyof Variable,
    value: string | boolean,
  ) => {
    const updated = variables.map((v) =>
      v.id === id ? { ...v, [field]: value } : v,
    );
    onChange(updated);
  };

  const addVariable = () => {
    onChange([
      ...variables,
      { id: Date.now().toString(), key: '', value: '', enabled: true },
    ]);
  };

  const deleteVariable = (id: string) => {
    if (variables.length > 1) {
      onChange(variables.filter((v) => v.id !== id));
    } else {
      onChange([
        { id: Date.now().toString(), key: '', value: '', enabled: true },
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
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variables.map((variable) => (
            <TableRow key={variable.id}>
              <TableCell>
                <Checkbox
                  checked={variable.enabled}
                  onCheckedChange={(checked) =>
                    updateVariable(variable.id, 'enabled', checked === true)
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  placeholder="Variable name"
                  value={variable.key}
                  onChange={(e) =>
                    updateVariable(variable.id, 'key', e.target.value)
                  }
                  disabled={!variable.enabled}
                  className="font-mono"
                />
              </TableCell>
              <TableCell>
                <Input
                  placeholder="Variable value"
                  value={variable.value}
                  onChange={(e) =>
                    updateVariable(variable.id, 'value', e.target.value)
                  }
                  disabled={!variable.enabled}
                  className="font-mono"
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteVariable(variable.id)}
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
