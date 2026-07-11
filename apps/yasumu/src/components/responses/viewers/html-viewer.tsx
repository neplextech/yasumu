'use client';

interface HtmlViewerProps {
  body: string;
}

export function HtmlViewer({ body }: HtmlViewerProps) {
  return (
    <iframe srcDoc={body} title="HTML Preview" className="h-full w-full border-0 bg-white" sandbox="allow-scripts" />
  );
}
