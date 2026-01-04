'use client';

import { useConsoleStore } from '@/stores/console-store';
import { cn } from '@yasumu/ui/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@yasumu/ui/components/tooltip';
import { VscTerminal } from 'react-icons/vsc';

export function ConsoleButton() {
  const { logs, setOpen } = useConsoleStore();

  const errorCount = logs.filter((l) => l.level === 'error').length;
  const warnCount = logs.filter((l) => l.level === 'warn').length;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpen(true)}
            className={cn(
              'flex items-center gap-2 px-2 h-full hover:bg-muted/50 transition-colors',
              logs.length > 0 ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            <VscTerminal className="size-3.5" />
            <span className="text-xs">Console</span>
            {(errorCount > 0 || warnCount > 0) && (
              <div className="flex items-center gap-1">
                {errorCount > 0 && (
                  <span className="text-red-400 text-[10px] font-mono">
                    {errorCount}
                  </span>
                )}
                {warnCount > 0 && (
                  <span className="text-amber-400 text-[10px] font-mono">
                    {warnCount}
                  </span>
                )}
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Open Console ({logs.length} messages)
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
