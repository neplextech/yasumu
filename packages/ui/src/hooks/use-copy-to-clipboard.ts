'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';

export function useCopyToClipboard() {
  const copy = useCallback((text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success('Copied to clipboard');
      })
      .catch((e) => {
        toast.error('Failed to copy to clipboard', {
          description: String(e),
        });
      });
  }, []);

  return copy;
}
