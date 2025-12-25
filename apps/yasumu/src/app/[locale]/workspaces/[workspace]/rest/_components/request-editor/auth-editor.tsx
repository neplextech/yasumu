import { KeyValuePair } from '@/components/tables/key-value-table';
import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yasumu/ui/components/select';
import { Input } from '@yasumu/ui/components/input';
import { Label } from '@yasumu/ui/components/label';
import { Button } from '@yasumu/ui/components/button';
import {
  interpolateEnvironmentVariables,
  useEnvironmentStore,
} from '@/app/[locale]/workspaces/_stores/environment-store';

interface AuthEditorProps {
  headers: KeyValuePair[];
  onChange: (headers: KeyValuePair[]) => void;
}

export default function AuthEditor({ headers, onChange }: AuthEditorProps) {
  const [authType, setAuthType] = useState<'basic' | 'bearer' | null>(null);
  const environment = useEnvironmentStore((state) =>
    state.getSelectedEnvironment(),
  );

  const updateAuthHeader = (value: string | null) => {
    if (!value)
      return onChange(
        headers.filter((h) => h.key.toLowerCase() !== 'authorization'),
      );
    const newHeaders = headers.filter(
      (h) => h.key.toLowerCase() !== 'authorization',
    );
    newHeaders.push({
      key: 'Authorization',
      value: interpolateEnvironmentVariables(environment, value),
      enabled: true,
    });
    onChange(newHeaders);
  };

  return (
    <div className="flex flex-col gap-4">
      <Select
        value={authType ?? undefined}
        onValueChange={(value) =>
          setAuthType(value === 'none' ? null : (value as typeof authType))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Auth Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="basic">Basic</SelectItem>
          <SelectItem value="bearer">Bearer</SelectItem>
          <SelectItem value="none">None</SelectItem>
        </SelectContent>
      </Select>
      {authType === 'basic' && <BasicAuthEditor onChange={updateAuthHeader} />}
      {authType === 'bearer' && (
        <BearerAuthEditor onChange={updateAuthHeader} />
      )}
    </div>
  );
}

function BasicAuthEditor({
  onChange,
}: {
  onChange: (value: string | null) => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const updateAuthHeader = () => {
    if (!username || !password) return onChange(null);
    onChange(`Basic ${btoa(`${username}:${password}`)}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Label>Username</Label>
        <Input onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <Label>Password</Label>
        <Input onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button onClick={updateAuthHeader}>Update</Button>
    </div>
  );
}

function BearerAuthEditor({
  onChange,
}: {
  onChange: (value: string | null) => void;
}) {
  const [token, setToken] = useState('');

  const handleTokenChange = () => {
    if (!token) return onChange(null);
    onChange(`Bearer ${token}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Label>Token</Label>
        <Input onChange={(e) => setToken(e.target.value)} />
      </div>
      <Button onClick={handleTokenChange}>Update</Button>
    </div>
  );
}
