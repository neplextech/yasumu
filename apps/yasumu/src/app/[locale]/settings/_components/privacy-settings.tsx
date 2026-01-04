'use client';

import { useState } from 'react';
import { Switch } from '@yasumu/ui/components/switch';
import { Button } from '@yasumu/ui/components/button';
import { relaunch } from '@tauri-apps/plugin-process';
import { RotateCcw } from 'lucide-react';
import SettingsSection from './settings-section';
import SettingItem from './setting-item';
import type { SettingsState } from './use-settings';

interface PrivacySettingsProps {
  settings: SettingsState;
  onUpdateSetting: <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K],
  ) => void;
}

export default function PrivacySettings({
  settings,
  onUpdateSetting,
}: PrivacySettingsProps) {
  const [modified, setModified] = useState(false);

  const handleAnalyticsChange = (value: boolean) => {
    onUpdateSetting('analyticsEnabled', value);
    setModified(true);
  };

  return (
    <SettingsSection
      title="Privacy"
      description="Control how Yasumu collects and uses data"
    >
      <SettingItem
        label="Usage Analytics"
        description="Help improve Yasumu by sending anonymous usage data"
      >
        <Switch
          checked={settings.analyticsEnabled}
          onCheckedChange={handleAnalyticsChange}
        />
      </SettingItem>
      <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
        <span>
          Analytics help us understand how Yasumu is used and identify issues.
          No personal data or request contents are collected. Changes take
          effect after restart.
        </span>
        {modified && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 cursor-pointer"
            onClick={() => relaunch()}
          >
            <RotateCcw className="size-3" />
            Restart
          </Button>
        )}
      </div>
    </SettingsSection>
  );
}
