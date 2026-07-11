'use client';

import { ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <div className="space-y-4 py-4">
      <div>
        <h3 className="mb-1 text-base font-semibold">{title}</h3>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
