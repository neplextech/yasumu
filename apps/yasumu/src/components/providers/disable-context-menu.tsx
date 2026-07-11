'use client';

import { useEffect } from 'react';

export function DisableContextMenu({ children }: React.PropsWithChildren) {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target;

      if (target instanceof HTMLElement) {
        const hasTextSelection = window.getSelection()?.toString();

        if (
          hasTextSelection ||
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target.isContentEditable ||
          target.closest('[data-allow-context-menu="true"], .monaco-editor')
        ) {
          return;
        }
      }

      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return <>{children}</>;
}
