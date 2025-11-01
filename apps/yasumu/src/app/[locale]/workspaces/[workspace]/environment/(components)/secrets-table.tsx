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

interface Secret {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  visible: boolean;
}

interface SecretsTableProps {
  secrets: Secret[];
  onChange: (secrets: Secret[]) => void;
}

export default function SecretsTable({ secrets, onChange }: SecretsTableProps) {
  const updateSecret = (
    id: string,
    field: keyof Secret,
    value: string | boolean,
  ) => {
    const updated = secrets.map((s) =>
      s.id === id ? { ...s, [field]: value } : s,
    );
    onChange(updated);
  };

  const addSecret = () => {
    onChange([
      ...secrets,
      {
        id: Date.now().toString(),
        key: '',
        value: '',
        enabled: true,
        visible: false,
      },
    ]);
  };

  const deleteSecret = (id: string) => {
    if (secrets.length > 1) {
      onChange(secrets.filter((s) => s.id !== id));
    } else {
      onChange([
        {
          id: Date.now().toString(),
          key: '',
          value: '',
          enabled: true,
          visible: false,
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
          {secrets.map((secret) => (
            <TableRow key={secret.id}>
              <TableCell>
                <Checkbox
                  checked={secret.enabled}
                  onCheckedChange={(checked) =>
                    updateSecret(secret.id, 'enabled', checked === true)
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  placeholder="Secret name"
                  value={secret.key}
                  onChange={(e) =>
                    updateSecret(secret.id, 'key', e.target.value)
                  }
                  disabled={!secret.enabled}
                  className="font-mono"
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Input
                    type={secret.visible ? 'text' : 'password'}
                    placeholder="Secret value"
                    value={secret.value}
                    onChange={(e) =>
                      updateSecret(secret.id, 'value', e.target.value)
                    }
                    disabled={!secret.enabled}
                    className="font-mono"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      updateSecret(secret.id, 'visible', !secret.visible)
                    }
                    disabled={!secret.enabled}
                  >
                    {secret.visible ? (
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
                  onClick={() => deleteSecret(secret.id)}
                  disabled={secrets.length === 1}
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
        onClick={addSecret}
        className="text-sm p-0 h-auto font-normal"
      >
        <Plus className="mr-1 h-3 w-3" /> Add new secret
      </Button>
    </div>
  );
}
