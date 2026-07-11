'use client';

import { FileQuestion } from 'lucide-react';

interface BinaryViewerProps {
  contentType: string;
}

export function BinaryViewer({ contentType }: BinaryViewerProps) {
  return (
    <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-4">
      <FileQuestion className="h-16 w-16 opacity-50" />
      <div className="text-center">
        <p className="font-medium">Preview not available</p>
        <p className="mt-1 text-sm">
          Previewing <code className="bg-muted rounded px-1">{contentType || 'unknown type'}</code> is not supported
        </p>
      </div>
    </div>
  );
}
