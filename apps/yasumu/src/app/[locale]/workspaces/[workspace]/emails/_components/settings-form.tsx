'use client';

import { Input } from '@yasumu/ui/components/input';
import { Label } from '@yasumu/ui/components/label';
import { Button } from '@yasumu/ui/components/button';

interface SettingsFormProps {
  username: string;
  password: string;
  port: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onPortChange: (value: string) => void;
  onSave: () => void;
}

export default function SettingsForm({
  username,
  password,
  port,
  onUsernameChange,
  onPasswordChange,
  onPortChange,
  onSave,
}: SettingsFormProps) {
  return (
    <div className="space-y-6 p-8">
      <div className="max-w-2xl">
        <h3 className="text-2xl font-bold mb-2">SMTP Server Configuration</h3>
        <p className="text-sm text-muted-foreground mb-8">
          Configure your local SMTP server settings. This is a catch-all mailbox
          for development purposes.
        </p>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username (Optional)</Label>
            <Input
              id="username"
              placeholder="mailbox@example.com"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for catch-all mailbox
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password (Optional)</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Authentication is optional for local development
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              type="number"
              placeholder="1025"
              value={port}
              onChange={(e) => onPortChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Default port: 1025</p>
          </div>
        </div>
        <Button onClick={onSave} className="mt-6">
          Save Settings
        </Button>
      </div>
    </div>
  );
}
