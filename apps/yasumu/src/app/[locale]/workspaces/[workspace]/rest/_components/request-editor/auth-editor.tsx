'use client';

import { KeyValuePair } from '@/components/tables/key-value-table';
import React, { useMemo, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yasumu/ui/components/select';
import { Label } from '@yasumu/ui/components/label';
import { InteropableInput, useVariablePopover } from '@/components/inputs';

interface AuthEditorProps {
  headers: KeyValuePair[];
  onChange: (headers: KeyValuePair[]) => void;
}

type AuthType = 'basic' | 'bearer' | 'none';

interface ParsedAuth {
  type: AuthType;
  value: string;
  username?: string;
  password?: string;
  token?: string;
}

function parseAuthHeader(headers: KeyValuePair[]): ParsedAuth {
  const authHeader = headers.find(
    (h) => h.key.toLowerCase() === 'authorization' && h.enabled,
  );

  if (!authHeader?.value) {
    return { type: 'none', value: '' };
  }

  const value = authHeader.value;

  if (value.startsWith('Basic ')) {
    const encoded = value.slice(6);
    try {
      const decoded = atob(encoded);
      const colonIndex = decoded.indexOf(':');
      if (colonIndex !== -1) {
        return {
          type: 'basic',
          value,
          username: decoded.slice(0, colonIndex),
          password: decoded.slice(colonIndex + 1),
        };
      }
    } catch {
      // Invalid base64, treat as raw value
    }
    return { type: 'basic', value, username: '', password: '' };
  }

  if (value.startsWith('Bearer ')) {
    return {
      type: 'bearer',
      value,
      token: value.slice(7),
    };
  }

  return { type: 'none', value: '' };
}

export default function AuthEditor({ headers, onChange }: AuthEditorProps) {
  const { renderVariablePopover } = useVariablePopover();

  const parsedAuth = useMemo(() => parseAuthHeader(headers), [headers]);

  const updateAuthHeader = useCallback(
    (value: string | null) => {
      const filteredHeaders = headers.filter(
        (h) => h.key.toLowerCase() !== 'authorization',
      );

      if (!value) {
        onChange(filteredHeaders);
        return;
      }

      onChange([
        ...filteredHeaders,
        {
          key: 'Authorization',
          value,
          enabled: true,
        },
      ]);
    },
    [headers, onChange],
  );

  const handleAuthTypeChange = useCallback(
    (type: string) => {
      switch (type) {
        case 'none':
          updateAuthHeader(null);
          break;
        case 'basic':
          updateAuthHeader('Basic ');
          break;
        case 'bearer':
          updateAuthHeader('Bearer ');
          break;
      }
    },
    [updateAuthHeader],
  );

  const handleBasicAuthChange = useCallback(
    (username: string, password: string) => {
      if (!username && !password) {
        updateAuthHeader(null);
        return;
      }
      const encoded = btoa(`${username}:${password}`);
      updateAuthHeader(`Basic ${encoded}`);
    },
    [updateAuthHeader],
  );

  const handleBearerAuthChange = useCallback(
    (token: string) => {
      if (!token) {
        updateAuthHeader(null);
        return;
      }
      updateAuthHeader(`Bearer ${token}`);
    },
    [updateAuthHeader],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Auth Type</Label>
        <Select value={parsedAuth.type} onValueChange={handleAuthTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select Auth Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="bearer">Bearer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {parsedAuth.type === 'basic' && (
        <BasicAuthEditor
          username={parsedAuth.username ?? ''}
          password={parsedAuth.password ?? ''}
          onChange={handleBasicAuthChange}
          renderVariablePopover={renderVariablePopover}
        />
      )}

      {parsedAuth.type === 'bearer' && (
        <BearerAuthEditor
          token={parsedAuth.token ?? ''}
          onChange={handleBearerAuthChange}
          renderVariablePopover={renderVariablePopover}
        />
      )}

      {parsedAuth.type === 'none' && (
        <div className="text-sm text-muted-foreground py-4 text-center">
          No authentication configured. Select an auth type above to add
          credentials.
        </div>
      )}
    </div>
  );
}

function BasicAuthEditor({
  username,
  password,
  onChange,
  renderVariablePopover,
}: {
  username: string;
  password: string;
  onChange: (username: string, password: string) => void;
  renderVariablePopover: (variableName: string) => React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[100px_1fr] items-center gap-2">
        <Label>Username</Label>
        <InteropableInput
          value={username}
          onChange={(val) => onChange(val, password)}
          onVariableClick={renderVariablePopover}
          placeholder="Enter username"
        />
      </div>
      <div className="grid grid-cols-[100px_1fr] items-center gap-2">
        <Label>Password</Label>
        <InteropableInput
          value={password}
          onChange={(val) => onChange(username, val)}
          onVariableClick={renderVariablePopover}
          placeholder="Enter password"
        />
      </div>
    </div>
  );
}

function BearerAuthEditor({
  token,
  onChange,
  renderVariablePopover,
}: {
  token: string;
  onChange: (token: string) => void;
  renderVariablePopover: (variableName: string) => React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[100px_1fr] items-center gap-2">
        <Label>Token</Label>
        <InteropableInput
          value={token}
          onChange={onChange}
          onVariableClick={renderVariablePopover}
          placeholder="Enter bearer token"
        />
      </div>
    </div>
  );
}
