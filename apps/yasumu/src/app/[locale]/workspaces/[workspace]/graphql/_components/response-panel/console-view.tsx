'use client';

import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { cn } from '@yasumu/ui/lib/utils';
import type {
  ScriptOutputEntry,
  ScriptOutputType,
} from '../../_hooks/use-graphql-request';

interface ConsoleViewProps {
  output: ScriptOutputEntry[];
}

function getOutputTypeStyles(type: ScriptOutputType): string {
  switch (type) {
    case 'info':
      return 'text-blue-500';
    case 'success':
      return 'text-green-500';
    case 'error':
      return 'text-red-500';
    case 'warning':
      return 'text-yellow-500';
    case 'test-pass':
      return 'text-green-500';
    case 'test-fail':
      return 'text-red-500';
    case 'test-skip':
      return 'text-gray-500';
    default:
      return 'text-muted-foreground';
  }
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

export function ConsoleView({ output }: ConsoleViewProps) {
  if (output.length === 0) {
    return (
      <p className="text-muted-foreground text-sm p-4">No console output</p>
    );
  }

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-1 font-mono text-sm">
        {output.map((entry, index) => (
          <div key={index} className="flex gap-2">
            <span className="text-muted-foreground shrink-0 text-xs">
              [{formatTimestamp(entry.timestamp)}]
            </span>
            <span className={cn('flex-1', getOutputTypeStyles(entry.type))}>
              {entry.message}
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
