import { cn } from '@yasumu/ui/lib/utils';
import { AlertCircle } from 'lucide-react';
import React from 'react';

export interface ErrorScreenProps {
  fullScreen?: boolean;
  message?: string;
}

export default function ErrorScreen({ fullScreen, message }: ErrorScreenProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        fullScreen && 'h-screen w-full overflow-hidden',
      )}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <AlertCircle className="text-destructive" size={48} />
        {message && <p className="text-sm text-center">{message}</p>}
      </div>
    </div>
  );
}
