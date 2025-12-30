'use client';

import { useMemo } from 'react';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import type { RestResponse } from '../../_lib/rest-request';
import { getContentType } from '@/components/responses/viewers';
import { formatBytes } from './utils';

interface BodyViewProps {
  response: RestResponse;
}

export function BodyView({ response }: BodyViewProps) {
  const formatted = useMemo(() => {
    if (response.bodyType !== 'text' || !response.textBody) {
      return null;
    }

    const contentType = getContentType(response.headers);
    if (contentType.includes('application/json')) {
      try {
        return JSON.stringify(JSON.parse(response.textBody), null, 2);
      } catch {
        return response.textBody;
      }
    }

    return response.textBody;
  }, [response]);

  if (response.bodyTruncated) {
    const maxSize = response.bodyType === 'text' ? '5 MB' : '50 MB';
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground p-4">
        <p className="font-medium">Response body too large to display</p>
        <p className="text-sm">
          Size: {formatBytes(response.size)} (max: {maxSize})
        </p>
      </div>
    );
  }

  if (response.bodyType === 'binary') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground p-4">
        <p className="font-medium">Binary response</p>
        <p className="text-sm">
          Size: {formatBytes(response.size)} - Use Preview tab to view
        </p>
      </div>
    );
  }

  if (!response.textBody) {
    return (
      <p className="text-muted-foreground text-sm p-4">Empty response body</p>
    );
  }

  return (
    <ScrollArea className="h-full">
      <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-all">
        <code>{formatted}</code>
      </pre>
    </ScrollArea>
  );
}
