'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yasumu/ui/components/tabs';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import MailboxTab from './_components/mailbox-tab';
import SettingsTab from './_components/settings-tab';
import EmailScriptEditor from './_components/email-script-editor';

export default function MailboxPage() {
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsStringEnum(['mailbox', 'settings'] as const).withDefault('mailbox'),
  );

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
            <TabsTrigger value="scripts">Script</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="mailbox" className="flex-1 m-0 p-0 overflow-hidden">
          <MailboxTab />
        </TabsContent>
        <TabsContent value="settings" className="flex-1 m-0 overflow-auto">
          <SettingsTab />
        </TabsContent>
        <TabsContent value="scripts" className="m-0">
          <EmailScriptEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
