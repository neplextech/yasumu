'use client';

import { ScrollArea } from '@yasumu/ui/components/scroll-area';

interface HeadersViewProps {
  headers: Record<string, string>;
}

export function HeadersView({ headers }: HeadersViewProps) {
  const entries = Object.entries(headers);

  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm p-4">No headers received</p>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-medium text-muted-foreground">
                Name
              </th>
              <th className="text-left py-2 font-medium text-muted-foreground">
                Value
              </th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {entries.map(([key, value]) => (
              <tr key={key} className="border-b border-border/50">
                <td className="py-2 pr-4 text-primary">{key}</td>
                <td className="py-2 break-all">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ScrollArea>
  );
}
