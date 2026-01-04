'use client';

import { Button } from '@yasumu/ui/components/button';
import { BookOpen } from 'lucide-react';
import { SiGithub } from 'react-icons/si';
import SettingsSection from './settings-section';
import SettingItem from './setting-item';
import type { AppInfo } from './use-settings';

interface AboutSettingsProps {
  appInfo: AppInfo | null;
}

export default function AboutSettings({ appInfo }: AboutSettingsProps) {
  const infoItems = [
    {
      label: 'Version',
      description: 'Current application version',
      value: appInfo?.version ?? 'N/A',
    },
    {
      label: 'Tauri Version',
      description: 'Current Tauri version',
      value: appInfo?.tauriVersion ?? 'N/A',
    },
    {
      label: 'Identifier',
      description: 'Current application identifier',
      value: appInfo?.identifier ?? 'N/A',
    },
    {
      label: 'Bundle Type',
      description: 'Current application bundle type',
      value: appInfo?.bundleType ?? 'N/A',
    },
  ];

  return (
    <SettingsSection title="About" description="Application information">
      {infoItems.map((item) => (
        <SettingItem
          key={item.label}
          label={item.label}
          description={item.description}
          className="m-0"
        >
          <div className="text-sm font-mono text-muted-foreground">
            {item.value}
          </div>
        </SettingItem>
      ))}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" size="sm" asChild>
          <a
            href="https://yasumu.dev/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            <BookOpen className="size-4" />
            Documentation
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a
            href="https://github.com/neplextech/yasumu"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SiGithub className="size-4" />
            GitHub
          </a>
        </Button>
      </div>
    </SettingsSection>
  );
}
