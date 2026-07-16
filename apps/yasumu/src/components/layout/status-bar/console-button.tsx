'use client';

import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@yasumu/ui/components/tooltip';
import { cn } from '@yasumu/ui/lib/utils';
import { VscTerminal } from 'react-icons/vsc';

import { useConsoleStore } from '@/stores/console-store';

export function ConsoleButton() {
  const logs = useConsoleStore((state) => state.logs);
  const setOpen = useConsoleStore((state) => state.setOpen);

  const errorCount = logs.filter((l) => l.level === 'error').length;
  const warnCount = logs.filter((l) => l.level === 'warn').length;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`Open console, ${logs.length} messages`}
            onClick={() => setOpen(true)}
            className={cn(
              'flex items-center gap-2 px-2 h-full hover:bg-muted/50 transition-colors',
              logs.length > 0 ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            <VscTerminal className="size-3.5" />
            <span className="text-xs">Console</span>
            {(errorCount > 0 || warnCount > 0) && (
              <span className="flex items-center gap-1" aria-label={`${errorCount} errors and ${warnCount} warnings`}>
                {errorCount > 0 && <span className="font-mono text-[10px] text-red-400">{errorCount}</span>}
                {warnCount > 0 && <span className="font-mono text-[10px] text-amber-400">{warnCount}</span>}
              </span>
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
