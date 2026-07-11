'use client';

import { Button } from '@yasumu/ui/components/button';
import { Input } from '@yasumu/ui/components/input';
import { Label } from '@yasumu/ui/components/label';
import { toast } from '@yasumu/ui/components/sonner';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';

import CodeBlock from '@/components/visuals/code-block/code-block';

interface SettingsFormProps {
  username: string;
  password: string;
  port: number | undefined;
  activePort: number | undefined;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onPortChange: (value: number) => void;
  onSave: () => void;
}

function getNodemailerSnippet(port: number) {
  return `import { createTransport } from 'nodemailer';

const transport = createTransport({
  host: 'localhost',
  port: ${port},
});

await transport.sendMail({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Hello from Yasumu',
  text: 'Hello World!',
  html: '<p>Hello World!</p>',
});`;
}

export default function SettingsForm({
  username,
  password,
  port,
  onUsernameChange,
  onPasswordChange,
  onPortChange,
  onSave,
  activePort,
}: SettingsFormProps) {
  const snippet = getNodemailerSnippet(activePort ?? 25);

  return (
    <div className="p-8">
      <div className="flex gap-8">
        <div className="max-w-xl flex-1 rounded-lg border p-4">
          <h3 className="mb-2 text-2xl font-bold">SMTP Server Configuration</h3>
          <p className="text-muted-foreground mb-8 text-sm">
            Configure your local SMTP server settings. This is a catch-all mailbox for development purposes.
          </p>
          {activePort && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800/30 dark:bg-green-950/20">
              <div className="relative">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <div className="absolute inset-0 h-3 w-3 animate-ping rounded-full bg-green-500 opacity-75"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">SMTP Server Online</p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Running on port <span className="font-mono font-bold underline">{activePort}</span>
                </p>
              </div>
              <Button
                variant="outline"
                className="border-green-300 text-green-700 dark:border-green-700 dark:text-green-300"
                onClick={withErrorHandler(async () => {
                  if (activePort == null) return;
                  await navigator.clipboard.writeText(`${activePort}`);
                  toast.success('Port copied to clipboard');
                })}
              >
                Copy Port
              </Button>
            </div>
          )}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username (Optional)</Label>
              <Input
                id="username"
                placeholder="mailbox@example.com"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">Leave empty for catch-all mailbox</p>
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
              <p className="text-muted-foreground text-xs">Authentication is optional for local development</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                placeholder="0"
                value={port}
                onChange={(e) => onPortChange(e.target.valueAsNumber)}
              />
              <p className="text-muted-foreground text-xs">Default port: 0 (random)</p>
            </div>
          </div>
          <Button onClick={onSave} className="mt-6">
            Save Settings
          </Button>
        </div>

        <div className="max-w-lg flex-1">
          <CodeBlock language="typescript" title="nodemailer-example.ts" iconClassName="text-blue-500 bg-white">
            {snippet}
          </CodeBlock>
          <p className="text-muted-foreground mt-3 text-xs">
            Use this snippet to send test emails to Yasumu&apos;s SMTP server.
          </p>
        </div>
      </div>
    </div>
  );
}
