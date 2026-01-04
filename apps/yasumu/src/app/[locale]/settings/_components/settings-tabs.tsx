'use client';

import { cn } from '@yasumu/ui/lib/utils';
import { Paintbrush, Shield, Info, LucideIcon } from 'lucide-react';

export type SettingsTab = 'appearance' | 'privacy' | 'about';

interface TabItem {
  id: SettingsTab;
  label: string;
  icon: LucideIcon;
}

const TABS: TabItem[] = [
  { id: 'appearance', label: 'Appearance', icon: Paintbrush },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'about', label: 'About', icon: Info },
];

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

export default function SettingsTabs({
  activeTab,
  onTabChange,
}: SettingsTabsProps) {
  return (
    <nav className="flex flex-col gap-1" role="tablist">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left cursor-pointer',
              'hover:bg-accent hover:text-accent-foreground',
              isActive && 'bg-accent text-accent-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
