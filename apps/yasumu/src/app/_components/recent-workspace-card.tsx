'use client';
import { DEFAULT_WORKSPACE_PATH } from '@yasumu/core';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { formatDistanceToNow } from 'date-fns';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { ArrowRight } from 'lucide-react';
import React, { useMemo } from 'react';

import { useYasumuRuntime } from '@/components/providers/workspace-provider';

dayjs.extend(utc);

export interface RecentWorkspace {
  id: string;
  name: string;
  path: string;
  lastOpenedAt?: Date | null;
}

export default function RecentWorkspaceCard({ workspace }: { workspace: RecentWorkspace }) {
  const { yasumu } = useYasumuRuntime();
  const time = useMemo(() => {
    if (!workspace.lastOpenedAt) return '';
    return `${formatDistanceToNow(workspace.lastOpenedAt)} ago`;
  }, [workspace.lastOpenedAt]);

  const pathValue = workspace.path === DEFAULT_WORKSPACE_PATH ? 'Default Workspace' : workspace.path;

  return (
    <button
      type="button"
      onClick={withErrorHandler(async () => {
        await yasumu.workspaces.open({ id: workspace.id });
      })}
      className="group bg-card hover:bg-accent hover:border-accent-foreground/10 focus-visible:ring-ring flex w-full cursor-pointer items-center justify-between rounded-xl border p-4 text-left transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <div className="flex flex-col gap-1">
        <span className="text-foreground group-hover:text-accent-foreground font-semibold transition-colors">
          {workspace.name}
        </span>
        <span className="text-muted-foreground max-w-[300px] truncate font-mono text-xs">{pathValue}</span>
      </div>
      <div className="flex items-center gap-4">
        {time && <span className="text-muted-foreground hidden text-xs sm:inline-block">{time}</span>}
        <ArrowRight
          className="text-muted-foreground/50 group-hover:text-accent-foreground size-4 transition-all group-hover:translate-x-1"
          aria-hidden="true"
        />
      </div>
    </button>
  );
}
