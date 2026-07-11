'use client';

import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { cn } from '@yasumu/ui/lib/utils';
import { Info, CheckCircle2, XCircle, AlertTriangle, TestTube2 } from 'lucide-react';

import type { ScriptOutputEntry, ScriptOutputType } from '../../_hooks/use-rest-request';

interface ConsoleViewProps {
  output: ScriptOutputEntry[];
}

const typeConfig: Record<ScriptOutputType, { icon: typeof Info; color: string }> = {
  info: {
    icon: Info,
    color: 'text-blue-400',
  },
  success: {
    icon: CheckCircle2,
    color: 'text-green-400',
  },
  error: {
    icon: XCircle,
    color: 'text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
  },
  'test-pass': {
    icon: TestTube2,
    color: 'text-green-400',
  },
  'test-fail': {
    icon: TestTube2,
    color: 'text-red-400',
  },
  'test-skip': {
    icon: TestTube2,
    color: 'text-yellow-400',
  },
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function ConsoleView({ output }: ConsoleViewProps) {
  if (output.length === 0) {
    return <p className="text-muted-foreground p-4 text-sm">No script output</p>;
  }

  return (
    <ScrollArea className="h-full" data-allow-context-menu="true">
      <div className="space-y-1.5 p-3 select-text">
        {output.map((entry, i) => {
          const config = typeConfig[entry.type];
          const Icon = config.icon;

          return (
            <div key={i} className="flex items-start gap-2 select-text">
              <Icon className={cn('size-4 mt-0.5 shrink-0', config.color)} />
              <div className="min-w-0 flex-1">
                <pre className={cn('text-sm font-mono whitespace-pre-wrap break-words select-text', config.color)}>
                  {entry.message}
                </pre>
              </div>
              <span className="text-muted-foreground mt-0.5 shrink-0 font-mono text-[10px] select-text">
                {formatTime(entry.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
