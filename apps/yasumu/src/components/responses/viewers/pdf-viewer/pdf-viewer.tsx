'use client';

import dynamic from 'next/dynamic';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';

const PdfDocument = dynamic(() => import('./pdf-document'), { ssr: false });

interface PdfViewerProps {
  src: string;
}

export function PdfViewer({ src }: PdfViewerProps) {
  return (
    <ScrollArea className="h-full">
      <PdfDocument data={src} />
    </ScrollArea>
  );
}
