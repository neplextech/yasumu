'use client';

import { invoke } from '@tauri-apps/api/core';
import { useEffect } from 'react';

export function FrontendReadyProvider({ children }: React.PropsWithChildren) {
  useEffect(() => {
    void invoke('on_frontend_ready').catch((error: unknown) => {
      console.error('Failed to notify the native host that the frontend is ready:', error);
    });
  }, []);

  return children;
}
