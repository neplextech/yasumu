'use client';

import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { cn } from '@yasumu/ui/lib/utils';
import {
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TestTube2,
} from 'lucide-react';
import type {
  ScriptOutputEntry,
  ScriptOutputType,
} from '../../_hooks/use-rest-request';

interface ConsoleViewProps {
  output: ScriptOutputEntry[];
}

const typeConfig: Record<
  ScriptOutputType,
  { icon: typeof Info; color: string }
> = {
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
    return (
      <p className="text-muted-foreground text-sm p-4">No script output</p>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1.5">
        {output.map((entry, i) => {
          const config = typeConfig[entry.type];
          const Icon = config.icon;

          return (
            <div key={i} className={'flex items-start gap-2'}>
              <Icon className={cn('size-4 mt-0.5 shrink-0', config.color)} />
              <div className="flex-1 min-w-0">
                <pre
                  className={cn(
                    'text-sm font-mono whitespace-pre-wrap break-words',
                    config.color,
                  )}
                >
                  {entry.message}
                </pre>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 font-mono mt-0.5">
                {formatTime(entry.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
