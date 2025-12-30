'use client';

import { cn } from '@yasumu/ui/lib/utils';
import type { RestResponse } from '../../_lib/rest-request';
import { formatBytes, getStatusColor } from './utils';

interface ResponseStatusBarProps {
  response: RestResponse;
}

export function ResponseStatusBar({ response }: ResponseStatusBarProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Status:</span>
        <span
          className={cn(
            'font-mono font-medium',
            getStatusColor(response.status),
          )}
        >
          {response.status} {response.statusText}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Time:</span>
        <span className="font-mono">{response.time.toFixed(0)}ms</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Size:</span>
        <span className="font-mono">{formatBytes(response.size)}</span>
      </div>
    </div>
  );
}
