'use client';

import { relaunch } from '@tauri-apps/plugin-process';
import { Button } from '@yasumu/ui/components/button';
import { Switch } from '@yasumu/ui/components/switch';
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';

import { setAnalyticsEnabled, trackEvent } from '@/lib/instrumentation/analytics';

import SettingItem from './setting-item';
import SettingsSection from './settings-section';
import type { SettingsState } from './use-settings';

interface PrivacySettingsProps {
  settings: SettingsState;
  onUpdateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
}

export default function PrivacySettings({ settings, onUpdateSetting }: PrivacySettingsProps) {
  const [modified, setModified] = useState(false);

  const handleAnalyticsChange = (value: boolean) => {
    onUpdateSetting('analyticsEnabled', value);
    setAnalyticsEnabled(value);
    trackEvent('settings_analytics_toggled', {
      enabled: value,
    });
    setModified(true);
  };

  return (
    <SettingsSection title="Privacy" description="Control how Yasumu collects and uses data">
      <SettingItem label="Usage Analytics" description="Help improve Yasumu by sending anonymous usage data">
        <Switch checked={settings.analyticsEnabled} onCheckedChange={handleAnalyticsChange} />
      </SettingItem>
      <div className="text-muted-foreground flex items-center gap-2 pl-1 text-xs">
        <span>
          Analytics help us understand how Yasumu is used and identify issues. No personal data or request contents are
          collected. Changes take effect after restart.
        </span>
        {modified && (
          <Button variant="outline" size="sm" className="shrink-0 cursor-pointer" onClick={() => relaunch()}>
            <RotateCcw className="size-3" />
            Restart
          </Button>
        )}
      </div>
    </SettingsSection>
  );
}
