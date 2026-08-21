'use client';

import { useRef } from 'react';

import { useIframeExternalLinks } from '@/hooks/use-iframe-external-links';

interface HtmlViewerProps {
  body: string;
}

export function HtmlViewer({ body }: HtmlViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const handleIframeLoad = useIframeExternalLinks(iframeRef);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={body}
      title="HTML Preview"
      className="h-full w-full border-0 bg-white"
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      onLoad={handleIframeLoad}
    />
  );
}
