'use client';

import { useEffect, useState, useCallback } from 'react';
import { Store } from '@tauri-apps/plugin-store';
import {
  getVersion,
  getTauriVersion,
  getIdentifier,
  getName,
  getBundleType,
  BundleType,
} from '@tauri-apps/api/app';
import { YASUMU_ANALYTICS_FLAG_KEY } from '@/lib/constants/instrumentation';

export interface SettingsState {
  analyticsEnabled: boolean;
}

export interface AppInfo {
  name: string;
  version: string;
  tauriVersion: string;
  identifier: string;
  bundleType: BundleType;
}

const DEFAULT_SETTINGS: SettingsState = {
  analyticsEnabled: true,
};

async function getStore() {
  return Store.load('yasumu-config.json').catch(() => null);
}

export function useSettings() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    async function loadAppInfo() {
      const [name, version, tauriVersion, identifier, bundleType] =
        await Promise.all([
          getName(),
          getVersion(),
          getTauriVersion(),
          getIdentifier(),
          getBundleType(),
        ]);

      setAppInfo({
        name,
        version,
        tauriVersion,
        identifier,
        bundleType,
      });
    }

    loadAppInfo().catch(console.error);
  }, []);

  useEffect(() => {
    async function loadSettings() {
      try {
        const store = await getStore();
        const analyticsEnabled = await store?.get<boolean>(
          YASUMU_ANALYTICS_FLAG_KEY,
        );

        setSettings({
          analyticsEnabled: analyticsEnabled ?? true,
        });
      } catch {
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings().catch(console.error);
  }, []);

  const updateSetting = useCallback(
    async <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));

      try {
        const store = await getStore();
        if (key === 'analyticsEnabled') {
          await store?.set(YASUMU_ANALYTICS_FLAG_KEY, value);
          await store?.save();
        }
      } catch (error) {
        console.error('Failed to save setting:', error);
      }
    },
    [],
  );

  return {
    settings,
    appInfo,
    isLoading,
    updateSetting,
  };
}
