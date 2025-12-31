'use client';

import { useEffect } from 'react';
import { preloadMonacoEditor } from '@/components/editors';
import { YASUMU_TYPE_DEFINITIONS } from '@/lib/types/yasumu-typedef';

export function MonacoPreloader() {
  useEffect(() => {
    preloadMonacoEditor(YASUMU_TYPE_DEFINITIONS);
  }, []);

  return null;
}

