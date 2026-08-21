import { useCallback, useEffect, useRef, type RefObject } from 'react';

import { handleExternalLinkClick } from '@/lib/external-links';

export function useIframeExternalLinks(iframeRef: RefObject<HTMLIFrameElement | null>, enabled = true) {
  const cleanupRef = useRef<(() => void) | null>(null);

  const handleLoad = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;

    try {
      const frameDocument = iframeRef.current?.contentDocument;
      if (!frameDocument) return;

      const handleClick = (event: MouseEvent) => {
        handleExternalLinkClick(event, {
          appOrigin: window.location.origin,
          baseUrl: frameDocument.baseURI,
        });
      };

      frameDocument.addEventListener('click', handleClick, true);
      cleanupRef.current = () => frameDocument.removeEventListener('click', handleClick, true);
    } catch (error) {
      console.warn('Unable to attach external-link handling to iframe content', error);
    }
  }, [iframeRef]);

  useEffect(() => {
    if (!enabled) {
      cleanupRef.current?.();
      cleanupRef.current = null;
    }

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [enabled]);

  return handleLoad;
}
