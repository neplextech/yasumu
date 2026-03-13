'use client';

import { cn } from '@yasumu/ui/lib/utils';
import type { GraphqlResponse } from '../../_lib/graphql-request';

interface GraphqlResponseStatusBarProps {
  response: GraphqlResponse;
}

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'text-green-500';
  if (status >= 300 && status < 400) return 'text-yellow-500';
  if (status >= 400 && status < 500) return 'text-orange-500';
  if (status >= 500) return 'text-red-500';
  return 'text-muted-foreground';
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function GraphqlResponseStatusBar({
  response,
}: GraphqlResponseStatusBarProps) {
  const hasErrors = response.errors && response.errors.length > 0;

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
        <span className="font-mono">{formatTime(response.time)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Size:</span>
        <span className="font-mono">{formatSize(response.size)}</span>
      </div>
      {hasErrors && (
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
            {response.errors!.length} error
            {response.errors!.length > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
