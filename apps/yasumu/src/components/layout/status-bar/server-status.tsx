'use client';

import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@yasumu/ui/components/tooltip';
import { cn } from '@yasumu/ui/lib/utils';
import { VscCircleFilled } from 'react-icons/vsc';

export interface ServerStatusProps {
  label: string;
  port: number | null;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  href?: string;
  onOpen?: () => void;
}

export function ServerStatus({ label, port, icon: Icon, active = false, href, onOpen }: ServerStatusProps) {
  const handleClick = () => {
    if (!href) return;
    onOpen?.();
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`${label}: ${port ? `port ${port}` : 'not running'}${href ? '. Open status page' : ''}`}
            className="hover:bg-muted/50 text-muted-foreground hover:text-foreground flex h-full items-center gap-1.5 px-2 transition-colors"
            onClick={handleClick}
            disabled={!href}
          >
            <span aria-hidden="true">
              <Icon className="size-3.5" />
            </span>
            <span className="font-mono text-xs">{port != null ? `${port}` : '—'}</span>
            <VscCircleFilled
              aria-hidden="true"
              className={cn('size-2', active && port ? 'text-emerald-500' : 'text-muted-foreground/50')}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {label}: {port ? `Port ${port}` : 'Not running'}
          {href ? ' Click to open.' : ''}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
