'use client';

import { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import EmailList from './(components)/email-list';
import EmailContent from './(components)/email-content';
import SettingsForm from './(components)/settings-form';

interface Email {
  id: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  preview: string;
  timestamp: string;
  unread: boolean;
}

const mockEmails: Email[] = [
  {
    id: '1',
    from: 'noreply@example.com',
    to: ['dev@localhost'],
    subject: 'Welcome to our service!',
    body: "Thank you for signing up! We're excited to have you on board.\n\nIf you have any questions, feel free to reach out.\n\nBest regards,\nThe Team",
    preview: "Thank you for signing up! We're excited to have you on board.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    unread: true,
  },
  {
    id: '2',
    from: 'support@company.com',
    to: ['dev@localhost'],
    subject: 'Your order has been processed',
    body: 'Dear Customer,\n\nYour order #12345 has been successfully processed and will be shipped soon.\n\nYou can track your order using the link below.\n\nThank you for your business!',
    preview:
      'Your order #12345 has been successfully processed and will be shipped soon.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unread: true,
  },
  {
    id: '3',
    from: 'notifications@system.com',
    to: ['dev@localhost'],
    subject: 'Password reset requested',
    body: 'You have requested to reset your password.\n\nClick the link below to reset your password:\nhttps://example.com/reset-password?token=abc123\n\nIf you did not request this, please ignore this email.',
    preview:
      'You have requested to reset your password. Click the link below...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    unread: false,
  },
  {
    id: '4',
    from: 'marketing@newsletter.com',
    to: ['dev@localhost'],
    subject: 'Weekly Newsletter - January 2024',
    body: 'Check out our latest updates!\n\n• New features released\n• Product updates\n• Community highlights\n\nRead more on our website.',
    preview:
      'Check out our latest updates! New features released, product updates...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    unread: false,
  },
  {
    id: '5',
    from: 'system@automated.com',
    to: ['dev@localhost'],
    subject: '',
    body: 'This is a test email without a subject line.\n\nIt demonstrates how the mailbox handles emails with missing subjects.',
    preview: 'This is a test email without a subject line.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    unread: false,
  },
];

export default function MailboxPage() {
  const [emails] = useState<Email[]>(mockEmails);
  const [selectedEmailId, setSelectedEmailId] = useState<string | undefined>();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [port, setPort] = useState('1025');
  const [activeTab, setActiveTab] = useState<'mailbox' | 'settings'>('mailbox');

  const selectedEmail = emails.find((e) => e.id === selectedEmailId);

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmailId(emailId);
    const email = emails.find((e) => e.id === emailId);
    if (email?.unread) {
      const updatedEmails = emails.map((e) =>
        e.id === emailId ? { ...e, unread: false } : e,
      );
    }
  };

  const handleSaveSettings = () => {
    console.log('Settings saved', { username, password, port });
  };

  return (
    <div className="flex h-full bg-background">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'mailbox' | 'settings')}
        className="flex flex-col flex-1"
      >
        <div className="border-b bg-background/50 backdrop-blur px-6 py-3">
          <TabsList>
            <TabsTrigger value="mailbox">Mailbox</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="mailbox" className="flex-1 m-0 p-0 overflow-hidden">
          <div className="flex h-full">
            <div className="w-[420px] shrink-0 border-r">
              <EmailList
                emails={emails}
                selectedEmailId={selectedEmailId}
                onSelectEmail={handleSelectEmail}
                filter={filter}
                onFilterChange={setFilter}
              />
            </div>
            <div className="flex-1 min-w-0">
              <EmailContent email={selectedEmail || null} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="settings" className="flex-1 m-0 overflow-auto">
          <SettingsForm
            username={username}
            password={password}
            port={port}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            onPortChange={setPort}
            onSave={handleSaveSettings}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
