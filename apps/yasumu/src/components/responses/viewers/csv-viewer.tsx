'use client';

import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { useMemo } from 'react';

interface CsvViewerProps {
  body: string;
}

function parseCsv(data: string): string[][] {
  if (!data) return [];
  const rows = data
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((row) => row.trim() !== '');
  return rows.map((row) => {
    const result: string[] = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"' && row[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cell);
        cell = '';
      } else {
        cell += char;
      }
    }
    result.push(cell);
    return result;
  });
}

export function CsvViewer({ body }: CsvViewerProps) {
  const rows = useMemo(() => parseCsv(body), [body]);

  if (rows.length === 0) {
    return (
      <ScrollArea className="h-full">
        <pre className="p-4 font-mono text-sm break-all whitespace-pre-wrap">{body}</pre>
      </ScrollArea>
    );
  }

  const headers = rows[0];

  return (
    <ScrollArea className="h-full">
      <div className="overflow-auto p-4">
        <table className="border-border w-full rounded border text-left">
          <thead>
            <tr>
              {headers.map((cell, i) => (
                <th key={i} className="border-border bg-muted border-b px-2 py-1 text-xs font-semibold">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, colIdx) => (
                  <td key={colIdx} className="border-border border-b px-2 py-1 text-xs">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ScrollArea>
  );
}
