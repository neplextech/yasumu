'use client';

import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { cn } from '@yasumu/ui/lib/utils';
import { CheckCircle2, XCircle, SkipForward } from 'lucide-react';

export interface TestResultItem {
  test: string;
  result: 'pass' | 'fail' | 'skip';
  error: string | null;
  duration: number;
}

interface TestViewProps {
  results: TestResultItem[];
}

const resultIcons = {
  pass: CheckCircle2,
  fail: XCircle,
  skip: SkipForward,
} as const;

const resultColors = {
  pass: 'text-green-500',
  fail: 'text-red-500',
  skip: 'text-yellow-500',
} as const;

export function TestView({ results }: TestViewProps) {
  if (results.length === 0) {
    return <p className="text-muted-foreground text-sm p-4">No test results</p>;
  }

  const passed = results.filter((r) => r.result === 'pass').length;
  const failed = results.filter((r) => r.result === 'fail').length;
  const skipped = results.filter((r) => r.result === 'skip').length;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4 font-mono">
        <div className="flex items-center gap-4 text-sm font-semibold">
          <span className="text-green-500">{passed} passed</span>
          {failed > 0 && <span className="text-red-500">{failed} failed</span>}
          {skipped > 0 && (
            <span className="text-yellow-500">{skipped} skipped</span>
          )}
          <span className="text-muted-foreground">{results.length} total</span>
        </div>

        <div className="space-y-2">
          {results.map((item, i) => {
            const Icon = resultIcons[item.result];
            return (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-md border',
                  item.result === 'fail' && 'border-red-500/30 bg-red-500/5',
                  item.result === 'pass' &&
                    'border-green-500/30 bg-green-500/5',
                  item.result === 'skip' &&
                    'border-yellow-500/30 bg-yellow-500/5',
                )}
              >
                <Icon
                  className={cn(
                    'size-4 mt-0.5 shrink-0',
                    resultColors[item.result],
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">
                      {item.test}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {item.duration.toFixed(2)}ms
                    </span>
                  </div>
                  {item.error && (
                    <pre className="mt-2 text-xs text-red-400 font-mono whitespace-pre-wrap break-all">
                      {item.error}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
