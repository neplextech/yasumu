import { cn } from '@yasumu/ui/lib/utils';
import { Loader2 } from 'lucide-react';
import React from 'react';

export interface LoadingScreenProps {
  fullScreen?: boolean;
  message?: string;
}

export default function LoadingScreen({
  fullScreen,
  message,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        fullScreen && 'h-screen w-full',
      )}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <Loader2 className="animate-spin" size={48} />
        {message && <p className="text-sm text-center">{message}</p>}
      </div>
    </div>
  );
}
