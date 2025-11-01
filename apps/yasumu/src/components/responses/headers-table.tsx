import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@yasumu/ui/components/table';

interface HeadersTableProps {
  headers: Record<string, string>;
}

export function HeadersTable({ headers }: HeadersTableProps) {
  return (
    <ScrollArea className="h-full">
      <Table className="border">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(headers).map(([key, value]) => (
            <TableRow key={key}>
              <TableCell className="font-medium">{key}</TableCell>
              <TableCell className="font-mono text-sm">{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
