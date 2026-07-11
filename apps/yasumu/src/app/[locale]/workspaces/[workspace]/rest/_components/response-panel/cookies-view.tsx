'use client';

import { ScrollArea } from '@yasumu/ui/components/scroll-area';

interface CookiesViewProps {
  cookies: string[];
}

export function CookiesView({ cookies }: CookiesViewProps) {
  if (cookies.length === 0) {
    return <p className="text-muted-foreground p-4 text-sm">No cookies received</p>;
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-4">
        {cookies.map((cookie, i) => (
          <pre key={i} className="bg-muted/50 rounded p-2 font-mono text-sm break-all whitespace-pre-wrap">
            {cookie}
          </pre>
        ))}
      </div>
    </ScrollArea>
  );
}
