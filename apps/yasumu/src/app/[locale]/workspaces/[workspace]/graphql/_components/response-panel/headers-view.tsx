'use client';

import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@yasumu/ui/components/table';

interface HeadersViewProps {
  headers: Record<string, string>;
}

export function HeadersView({ headers }: HeadersViewProps) {
  const headerEntries = Object.entries(headers);

  if (headerEntries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm p-4">
        No headers in response
      </p>
    );
  }

  return (
    <ScrollArea className="h-full p-4">
      <Table className="border">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {headerEntries.map(([name, value]) => (
            <TableRow key={name}>
              <TableCell className="font-mono text-sm font-medium">
                {name}
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground break-all">
                {value}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
