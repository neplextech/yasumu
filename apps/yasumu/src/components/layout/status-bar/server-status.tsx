'use client';

import { cn } from '@yasumu/ui/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@yasumu/ui/components/tooltip';
import { VscCircleFilled } from 'react-icons/vsc';

export interface ServerStatusProps {
  label: string;
  port: number | null;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}

export function ServerStatus({
  label,
  port,
  icon: Icon,
  active = false,
}: ServerStatusProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="flex items-center gap-1.5 px-2 h-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
            <Icon className="size-3.5" />
            <span className="text-xs font-mono">
              {port != null ? `${port}` : '—'}
            </span>
            <VscCircleFilled
              className={cn(
                'size-2',
                active && port
                  ? 'text-emerald-500'
                  : 'text-muted-foreground/50',
              )}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {label}: {port ? `Port ${port}` : 'Not running'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
