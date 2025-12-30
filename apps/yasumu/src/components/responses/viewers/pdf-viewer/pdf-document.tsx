'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { FileWarning, Loader2 } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const options = {
  cMapUrl: '/cmaps/',
  standardFontDataUrl: '/standard_fonts/',
};

interface PdfDocumentProps {
  data: string;
}

export default function PdfDocument({ data }: PdfDocumentProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(err: Error) {
    setError(err.message);
    setLoading(false);
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground p-8">
        <FileWarning className="w-12 h-12 opacity-50" />
        <div className="text-center">
          <p className="font-medium">Failed to load PDF</p>
          <p className="text-sm mt-1 text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 gap-4">
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading PDF...</span>
        </div>
      )}
      <Document
        file={data}
        options={options}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        className="flex flex-col items-center gap-4"
        loading={null}
      >
        {numPages &&
          Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i}
              pageNumber={i + 1}
              className="shadow-lg"
              renderTextLayer
              renderAnnotationLayer
            />
          ))}
      </Document>
    </div>
  );
}
