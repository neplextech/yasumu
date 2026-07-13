'use client';
import { invoke } from '@tauri-apps/api/core';
import { useEffect } from 'react';

export function PermissionPromptProvider({ children }: React.PropsWithChildren) {
  useEffect(() => {
    invoke('on_frontend_ready').catch((e) => {
      console.error('Failed to on frontend ready', e);
    });
  }, []);

  return <>{children}</>;
}
