'use client';

import { useState } from 'react';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Button } from '@yasumu/ui/components/button';
import { X } from 'lucide-react';
import { useMounted } from '@yasumu/ui/hooks/use-mounted';
import { useRouter } from 'next/navigation';
import { useHotkeys } from 'react-hotkeys-hook';
import SettingsTabs, { SettingsTab } from './_components/settings-tabs';
import AppearanceSettings from './_components/appearance-settings';
import PrivacySettings from './_components/privacy-settings';
import AboutSettings from './_components/about-settings';
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
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-56 shrink-0 border-r border-border bg-muted/30">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <h1 className="text-lg font-semibold">Settings</h1>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 cursor-pointer"
            onClick={() => router.back()}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="p-3">
          <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-8 max-w-2xl">
            {activeTab === 'appearance' && <AppearanceSettings />}
            {activeTab === 'privacy' && (
              <PrivacySettings
                settings={settings}
                onUpdateSetting={updateSetting}
              />
            )}
            {activeTab === 'about' && <AboutSettings appInfo={appInfo} />}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
