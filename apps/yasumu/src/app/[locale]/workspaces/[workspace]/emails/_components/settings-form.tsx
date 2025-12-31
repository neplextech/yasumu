'use client';

import { Input } from '@yasumu/ui/components/input';
import { Label } from '@yasumu/ui/components/label';
import { Button } from '@yasumu/ui/components/button';
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
        <div className="flex-1 max-w-xl border rounded-lg p-4">
          <h3 className="text-2xl font-bold mb-2">SMTP Server Configuration</h3>
          <p className="text-sm text-muted-foreground mb-8">
            Configure your local SMTP server settings. This is a catch-all
            mailbox for development purposes.
          </p>
          {activePort && (
            <div className="flex items-center gap-3 mb-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-lg">
              <div className="relative">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <div className="absolute inset-0 h-3 w-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  SMTP Server Online
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Running on port{' '}
                  <span className="font-bold font-mono underline">
                    {activePort}
                  </span>
                </p>
              </div>
              <Button
                variant="outline"
                className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
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
                placeholder="0"
                value={port}
                onChange={(e) => onPortChange(e.target.valueAsNumber)}
              />
              <p className="text-xs text-muted-foreground">
                Default port: 0 (random)
              </p>
            </div>
          </div>
          <Button onClick={onSave} className="mt-6">
            Save Settings
          </Button>
        </div>

        <div className="flex-1 max-w-lg">
          <CodeBlock
            language="typescript"
            title="nodemailer-example.ts"
            iconClassName="text-blue-500 bg-white"
          >
            {snippet}
          </CodeBlock>
          <p className="text-xs text-muted-foreground mt-3">
            Use this snippet to send test emails to Yasumu&apos;s SMTP server.
          </p>
        </div>
      </div>
    </div>
  );
}
