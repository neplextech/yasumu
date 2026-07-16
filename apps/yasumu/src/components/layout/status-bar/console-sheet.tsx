'use client';

import { Button } from '@yasumu/ui/components/button';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@yasumu/ui/components/sheet';
import { cn } from '@yasumu/ui/lib/utils';
import Ansi from 'ansi-to-react';
import { format } from 'date-fns';
import { VscTrash } from 'react-icons/vsc';

import { useConsoleStore, ConsoleLogEntry } from '@/stores/console-store';

const LOG_LEVEL_COLORS = {
  log: 'text-muted-foreground',
  info: 'text-blue-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
} as const;

function ConsoleLogLevel({ level }: { level: ConsoleLogEntry['level'] }) {
  return <span className={cn('uppercase text-[10px] font-bold w-12', LOG_LEVEL_COLORS[level])}>[{level}]</span>;
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
      <span className="text-muted-foreground w-16 shrink-0 text-[10px]">{format(log.timestamp, 'HH:mm:ss')}</span>
      <ConsoleLogLevel level={log.level} />
      <span className="flex-1 break-all whitespace-pre-wrap">
        <Ansi className="font-mono text-xs">{log.message}</Ansi>
      </span>
    </div>
  );
}

export function ConsoleSheet() {
  const logs = useConsoleStore((state) => state.logs);
  const isOpen = useConsoleStore((state) => state.isOpen);
  const setOpen = useConsoleStore((state) => state.setOpen);
  const clearLogs = useConsoleStore((state) => state.clearLogs);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="h-[40vh] max-h-[400px] gap-0 p-0">
        <SheetHeader className="flex-row items-center justify-between space-y-0 border-b px-4 py-2">
          <SheetTitle className="text-sm font-medium">Console</SheetTitle>
          <div className="mr-8 flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              {logs.length} message{logs.length !== 1 ? 's' : ''}
            </span>
            <Button variant="ghost" size="sm" onClick={clearLogs} className="h-6 px-2 text-xs">
              <VscTrash className="mr-1 size-3" />
              Clear
            </Button>
          </div>
        </SheetHeader>
        <ScrollArea className="h-[calc(100%-44px)] flex-1">
          <div className="space-y-0.5 p-2 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-muted-foreground flex h-32 items-center justify-center">No console messages yet</div>
            ) : (
              logs.map((log) => <ConsoleLogRow key={log.id} log={log} />)
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
