'use client';

import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { cn } from '@yasumu/ui/lib/utils';

interface ConsoleViewProps {
  output: string[];
}

export function ConsoleView({ output }: ConsoleViewProps) {
  if (output.length === 0) {
    return (
      <p className="text-muted-foreground text-sm p-4">No script output</p>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-1">
        {output.map((line, i) => (
          <pre
            key={i}
            className={cn(
              'text-sm font-mono',
              line.includes('error') || line.includes('failed')
                ? 'text-red-400'
                : line.includes('success')
                  ? 'text-green-400'
                  : 'text-foreground',
            )}
          >
            {line}
          </pre>
        ))}
      </div>
    </ScrollArea>
  );
}
