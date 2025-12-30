'use client';

import { FileQuestion } from 'lucide-react';

interface BinaryViewerProps {
  contentType: string;
}

export function BinaryViewer({ contentType }: BinaryViewerProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
      <FileQuestion className="w-16 h-16 opacity-50" />
      <div className="text-center">
        <p className="font-medium">Preview not available</p>
        <p className="text-sm mt-1">
          Previewing{' '}
          <code className="bg-muted px-1 rounded">
            {contentType || 'unknown type'}
          </code>{' '}
          is not supported
        </p>
      </div>
    </div>
  );
}
