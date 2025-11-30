'use client';
import { useYasumu } from '@/components/providers/workspace-provider';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import React, { useMemo } from 'react';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';

dayjs.extend(utc);

export interface RecentWorkspace {
  id: string;
  name: string;
  path: string;
  lastOpenedAt?: Date;
}

export default function RecentWorkspaceCard({
  workspace,
}: {
  workspace: RecentWorkspace;
}) {
  const { yasumu } = useYasumu();
  const time = useMemo(() => {
    if (!workspace.lastOpenedAt) return '';
    return formatDistanceToNow(workspace.lastOpenedAt);
  }, [workspace.lastOpenedAt]);

  return (
    <a
      onClick={withErrorHandler(async (e) => {
        e.preventDefault();
        await yasumu.workspaces.open({ id: workspace.id });
      })}
      className="group flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent hover:border-accent-foreground/10 transition-all duration-200 cursor-pointer"
    >
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-foreground group-hover:text-accent-foreground transition-colors">
          {workspace.name}
        </span>
        <span className="text-xs text-muted-foreground font-mono truncate max-w-[300px]">
          {workspace.path}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {time && (
          <span className="text-xs text-muted-foreground hidden sm:inline-block">
            {time}
          </span>
        )}
        <ArrowRight className="size-4 text-muted-foreground/50 group-hover:text-accent-foreground group-hover:translate-x-1 transition-all" />
      </div>
    </a>
  );
}
