'use client';

import { useEffect } from 'react';

import { preloadMonacoEditor } from '@/components/editors';
import { YASUMU_TYPE_DEFINITIONS } from '@/lib/types/yasumu-typedef';

export function MonacoPreloader() {
  useEffect(() => {
    void preloadMonacoEditor(YASUMU_TYPE_DEFINITIONS).catch((error: unknown) => {
      console.error('Failed to preload the workspace editor:', error);
    });
  }, []);

  return null;
}
