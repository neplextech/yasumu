import { cn } from '@yasumu/ui/lib/utils';
import { AlertCircle } from 'lucide-react';
import React from 'react';

export interface ErrorScreenProps {
  fullScreen?: boolean;
  message?: string;
  title?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function ErrorScreen({ fullScreen, message, title, action, className }: ErrorScreenProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(
        'flex items-center justify-center',
        fullScreen && 'h-full min-h-0 w-full overflow-hidden',
        className,
      )}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <AlertCircle className="text-destructive" size={48} aria-hidden="true" />
        {title ? <h1 className="text-center text-lg font-semibold">{title}</h1> : null}
        <p className="text-center text-sm">{message ?? 'Something went wrong.'}</p>
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}
