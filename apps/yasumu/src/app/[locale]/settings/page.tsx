'use client';

import { Button } from '@yasumu/ui/components/button';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { useMounted } from '@yasumu/ui/hooks/use-mounted';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import AboutSettings from './_components/about-settings';
import AppearanceSettings from './_components/appearance-settings';
import PrivacySettings from './_components/privacy-settings';
import SettingsTabs, { SettingsTab } from './_components/settings-tabs';
import { useSettings } from './_components/use-settings';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const { settings, appInfo, isLoading, updateSetting } = useSettings();
  const mounted = useMounted();
  const router = useRouter();

  useHotkeys(
    'esc',
    () => {
      router.back();
    },
    { preventDefault: true, enableOnFormTags: false },
  );

  if (!mounted || isLoading) {
    return (
      <div className="bg-background flex h-full items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="bg-background flex h-screen">
      <aside className="border-border bg-muted/30 w-56 shrink-0 border-r">
        <div className="border-border flex items-center justify-between border-b px-4 py-4">
          <h1 className="text-lg font-semibold">Settings</h1>
          <Button variant="ghost" size="icon" className="size-7 cursor-pointer" onClick={() => router.back()}>
            <X className="size-4" />
          </Button>
        </div>
        <div className="p-3">
          <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-2xl p-8">
            {activeTab === 'appearance' && <AppearanceSettings />}
            {activeTab === 'privacy' && <PrivacySettings settings={settings} onUpdateSetting={updateSetting} />}
            {activeTab === 'about' && <AboutSettings appInfo={appInfo} />}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
