'use client';

import { invoke } from '@tauri-apps/api/core';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { useHotkeys } from 'react-hotkeys-hook';

export default function useDevtools() {
  useHotkeys(
    'mod+shift+i',
    withErrorHandler(() => {
      return invoke('yasumu_open_devtools');
    }),
    { preventDefault: true },
  );
}
