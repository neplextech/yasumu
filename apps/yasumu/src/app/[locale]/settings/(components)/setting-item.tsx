'use client';

import { ReactNode } from 'react';
import { Label } from '@yasumu/ui/components/label';
import { cn } from '@yasumu/ui/lib/utils';

interface SettingItemProps {
  label: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function SettingItem({
  label,
  description,
  children,
  className,
}: SettingItemProps) {
  return (
    <div
      className={cn('flex items-start justify-between gap-4 py-2', className)}
    >
      <div className="flex-1 space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="w-[300px] shrink-0">{children}</div>
    </div>
  );
}
