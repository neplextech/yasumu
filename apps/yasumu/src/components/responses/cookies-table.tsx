import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@yasumu/ui/components/table';
import { parse } from 'set-cookie-parser';

interface CookiesTableProps {
  cookies: string[];
}

interface ParsedCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: Date | string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
  maxAge?: number;
}

export function CookiesTable({ cookies }: CookiesTableProps) {
  const parsedCookies = parse(cookies) as unknown as ParsedCookie[];

  if (cookies.length === 0) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
        No cookies in this response
      </div>
    );
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="w-full min-w-max">
        <Table className="border">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Name</TableHead>
              <TableHead className="w-[200px]">Value</TableHead>
              <TableHead className="w-[120px]">Domain</TableHead>
              <TableHead className="w-[100px]">Path</TableHead>
              <TableHead className="w-[150px]">Expires</TableHead>
              <TableHead className="w-[80px]">HttpOnly</TableHead>
              <TableHead className="w-[80px]">Secure</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parsedCookies.map((cookie, i) => (
              <TableRow key={i}>
                <TableCell className="max-w-[150px] truncate font-medium" title={cookie.name}>
                  {cookie.name}
                </TableCell>
                <TableCell className="max-w-[200px] truncate font-mono text-sm" title={cookie.value}>
                  {cookie.value}
                </TableCell>
                <TableCell className="max-w-[120px] truncate text-sm">{cookie.domain || '-'}</TableCell>
                <TableCell className="max-w-[100px] truncate text-sm">{cookie.path || '-'}</TableCell>
                <TableCell className="max-w-[150px] truncate text-sm" title={cookie.expires?.toString()}>
                  {cookie.expires ? new Date(cookie.expires).toLocaleString() : '-'}
                </TableCell>
                <TableCell className="text-sm">{cookie.httpOnly ? '✓' : ''}</TableCell>
                <TableCell className="text-sm">{cookie.secure ? '✓' : ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
}
