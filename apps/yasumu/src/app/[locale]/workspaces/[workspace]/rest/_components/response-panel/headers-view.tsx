'use client';

import { ScrollArea } from '@yasumu/ui/components/scroll-area';

interface HeadersViewProps {
  headers: Record<string, string>;
}

export function HeadersView({ headers }: HeadersViewProps) {
  const entries = Object.entries(headers);

  if (entries.length === 0) {
    return <p className="text-muted-foreground p-4 text-sm">No headers received</p>;
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-muted-foreground py-2 text-left font-medium">Name</th>
              <th className="text-muted-foreground py-2 text-left font-medium">Value</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {entries.map(([key, value]) => (
              <tr key={key} className="border-border/50 border-b">
                <td className="text-primary py-2 pr-4">{key}</td>
                <td className="py-2 break-all">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ScrollArea>
  );
}
