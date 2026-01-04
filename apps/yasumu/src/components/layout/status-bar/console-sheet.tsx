'use client';

import { useConsoleStore, ConsoleLogEntry } from '@/stores/console-store';
import { cn } from '@yasumu/ui/lib/utils';
import { VscTrash } from 'react-icons/vsc';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@yasumu/ui/components/sheet';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Button } from '@yasumu/ui/components/button';
import { format } from 'date-fns';
import Ansi from 'ansi-to-react';

const LOG_LEVEL_COLORS = {
  log: 'text-muted-foreground',
  info: 'text-blue-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
} as const;

function ConsoleLogLevel({ level }: { level: ConsoleLogEntry['level'] }) {
  return (
    <span
      className={cn(
        'uppercase text-[10px] font-bold w-12',
        LOG_LEVEL_COLORS[level],
      )}
    >
      [{level}]
    </span>
  );
}

function ConsoleLogRow({ log }: { log: ConsoleLogEntry }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 px-2 py-0.5 rounded hover:bg-muted/50',
        log.level === 'error' && 'bg-red-500/5',
        log.level === 'warn' && 'bg-amber-500/5',
      )}
    >
      <span className="text-muted-foreground text-[10px] shrink-0 w-16">
        {format(log.timestamp, 'HH:mm:ss')}
      </span>
      <ConsoleLogLevel level={log.level} />
      <span className="flex-1 break-all whitespace-pre-wrap">
        <Ansi className="text-xs font-mono">{log.message}</Ansi>
      </span>
    </div>
  );
}

export function ConsoleSheet() {
  const { logs, isOpen, setOpen, clearLogs } = useConsoleStore();

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="h-[40vh] max-h-[400px] p-0 gap-0">
        <SheetHeader className="flex-row items-center justify-between border-b py-2 px-4 space-y-0">
          <SheetTitle className="text-sm font-medium">Console</SheetTitle>
          <div className="flex items-center gap-2 mr-8">
            <span className="text-xs text-muted-foreground">
              {logs.length} message{logs.length !== 1 ? 's' : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLogs}
              className="h-6 px-2 text-xs"
            >
              <VscTrash className="size-3 mr-1" />
              Clear
            </Button>
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1 h-[calc(100%-44px)]">
          <div className="p-2 font-mono text-xs space-y-0.5">
            {logs.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No console messages yet
              </div>
            ) : (
              logs.map((log) => <ConsoleLogRow key={log.id} log={log} />)
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
