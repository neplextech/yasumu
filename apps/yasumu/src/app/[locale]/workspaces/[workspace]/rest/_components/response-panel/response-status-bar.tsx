'use client';

import { Badge } from '@yasumu/ui/components/badge';
import { cn } from '@yasumu/ui/lib/utils';

import type { RestResponse } from '../../_lib/rest-request';
import { formatBytes, getStatusColor } from './utils';

interface ResponseStatusBarProps {
  response: RestResponse;
}

export function ResponseStatusBar({ response }: ResponseStatusBarProps) {
  return (
    <div className="bg-muted/30 flex items-center gap-4 border-b px-4 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Status:</span>
        <span className={cn('font-mono font-medium', getStatusColor(response.status))}>
          {response.status} {response.statusText}
        </span>
      </div>
      {response.isEventStream ? (
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={response.streamConnected ? 'default' : 'outline'}>
            {response.streamConnected ? 'Live' : 'Closed'}
          </Badge>
          <span className="text-muted-foreground font-mono text-xs">{response.events.length} events</span>
        </div>
      ) : null}
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
