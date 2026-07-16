'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@yasumu/ui/components/tabs';
import { parseAsStringEnum, useQueryState } from 'nuqs';

import EmailScriptEditor from './_components/email-script-editor';
import MailboxTab from './_components/mailbox-tab';
import SettingsTab from './_components/settings-tab';

export default function MailboxPage() {
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsStringEnum(['mailbox', 'settings', 'scripts'] as const).withDefault('mailbox'),
  );

  return (
    <div className="bg-background flex h-full">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'mailbox' | 'settings' | 'scripts')}
        className="flex flex-1 flex-col"
      >
        <div className="bg-background/50 border-b px-6 py-3 backdrop-blur">
          <TabsList>
            <TabsTrigger value="mailbox">Mailbox</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="scripts">Script</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="mailbox" className="m-0 flex-1 overflow-hidden p-0">
          <MailboxTab />
        </TabsContent>
        <TabsContent value="settings" className="m-0 flex-1 overflow-auto">
          <SettingsTab />
        </TabsContent>
        <TabsContent value="scripts" className="m-0">
          <EmailScriptEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
