'use client';

import { ScrollArea } from '@yasumu/ui/components/scroll-area';

interface TextViewerProps {
  body: string;
}

export function TextViewer({ body }: TextViewerProps) {
  return (
    <ScrollArea className="h-full">
      <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-all">
        {body}
      </pre>
    </ScrollArea>
  );
}
