'use client';

import { useMemo } from 'react';
import { ResponseStatusBar, ResponseTabs } from '@/components/responses';
import { useRestOutput } from '../_providers/rest-output';
import LoadingScreen from '@/components/visuals/loading-screen';
import YasumuLogo from '@/components/visuals/yasumu-logo';

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function OutputConsole() {
  const { output, isLoading } = useRestOutput();

  const prettifiedJson = useMemo(() => {
    if (!output?.headers) return '';
    try {
      const contentType = Object.entries(output?.headers ?? {}).find(
        ([key]) => key.toLowerCase() === 'content-type',
      )?.[1];
      if (contentType && contentType.includes('application/json')) {
        return JSON.stringify(JSON.parse(output.body ?? '{}'), null, 2);
      }
      return output.body;
    } catch (e) {
      console.error(e);
      return output.body; // Fallback to raw body on error
    }
  }, [output?.body, output?.headers]);

  const size = useMemo(() => {
    if (!output) return undefined;

    // Try Content-Length header first
    const contentLength = Object.entries(output.headers ?? {}).find(
      ([key]) => key.toLowerCase() === 'content-length',
    )?.[1];

    if (contentLength) {
      return formatBytes(parseInt(contentLength, 10));
    }

    // Fallback to body length (approximate for text)
    return formatBytes(new Blob([output.body]).size);
  }, [output]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center border-t bg-background/50">
        <LoadingScreen message="Sending Request..." />
      </div>
    );
  }

  if (!output) {
    return (
      <div className="flex flex-col h-full items-center justify-center border-t bg-muted/5 text-muted-foreground gap-2 select-none">
        <div className="opacity-20 grayscale">
          <YasumuLogo width={64} height={64} />
        </div>
        <p className="text-sm">Send a request to see the response here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-t bg-background">
      <ResponseStatusBar
        status={output?.status ?? 0}
        statusText={output?.statusText ?? ''}
        time={(output?.time ?? 0).toFixed(2)}
        size={size}
      />
      <ResponseTabs
        prettyContent={prettifiedJson}
        rawContent={output.raw}
        headers={output.headers}
        cookies={output.cookies}
      />
    </div>
  );
}
