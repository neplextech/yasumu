'use client';

import { useMemo } from 'react';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';

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
        <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-all">
          {body}
        </pre>
      </ScrollArea>
    );
  }

  const headers = rows[0];

  return (
    <ScrollArea className="h-full">
      <div className="p-4 overflow-auto">
        <table className="w-full text-left border border-border rounded">
          <thead>
            <tr>
              {headers.map((cell, i) => (
                <th
                  key={i}
                  className="px-2 py-1 border-b border-border text-xs font-semibold bg-muted"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(1).map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, colIdx) => (
                  <td
                    key={colIdx}
                    className="px-2 py-1 border-b border-border text-xs"
                  >
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
