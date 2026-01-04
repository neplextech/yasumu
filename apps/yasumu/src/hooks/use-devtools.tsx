'use client';

import { useHotkeys } from 'react-hotkeys-hook';
import { invoke } from '@tauri-apps/api/core';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';

export default function useDevtools() {
  useHotkeys(
    'mod+shift+i',
    withErrorHandler(() => {
      return invoke('yasumu_open_devtools');
    }),
    { preventDefault: true },
  );
}
