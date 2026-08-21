'use client';

import { useEffect } from 'react';

import { handleExternalLinkClick } from '@/lib/external-links';

export function ExternalLinkHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      handleExternalLinkClick(event, {
        appOrigin: window.location.origin,
        baseUrl: document.baseURI,
      });
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return children;
}
