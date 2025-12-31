'use client';

import { useState, useEffect } from 'react';
import { type } from '@tauri-apps/plugin-os';

interface PlatformInfo {
  platform: string;
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
}

export function usePlatform(): PlatformInfo {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    platform: 'unknown',
    isMac: false,
    isWindows: false,
    isLinux: false,
  });

  useEffect(() => {
    try {
      const p = type();
      setPlatformInfo({
        platform: p,
        isMac: p === 'macos',
        isWindows: p === 'windows',
        isLinux: p === 'linux',
      });
    } catch {
      const p = navigator.platform.toLowerCase();
      setPlatformInfo({
        platform: p,
        isMac: p.startsWith('Mac'),
        isWindows: p.startsWith('Win'),
        isLinux: p.startsWith('Linux'),
      });
    }
  }, []);

  return platformInfo;
}
