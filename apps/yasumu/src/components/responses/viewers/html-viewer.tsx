'use client';

interface HtmlViewerProps {
  body: string;
}

export function HtmlViewer({ body }: HtmlViewerProps) {
  return (
    <iframe
      srcDoc={body}
      title="HTML Preview"
      className="w-full h-full border-0 bg-white"
      sandbox="allow-scripts"
    />
  );
}
