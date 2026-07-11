'use client';

import { ScrollArea } from '@yasumu/ui/components/scroll-area';

interface TextViewerProps {
  body: string;
}

export function TextViewer({ body }: TextViewerProps) {
  return (
    <ScrollArea className="h-full">
      <pre className="p-4 font-mono text-sm break-all whitespace-pre-wrap">{body}</pre>
    </ScrollArea>
  );
}
