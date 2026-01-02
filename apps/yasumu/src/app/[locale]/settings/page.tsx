'use client';

import { useEffect, useState, useCallback } from 'react';
import { Store } from '@tauri-apps/plugin-store';
import { useTheme } from 'next-themes';
import { ScrollArea } from '@yasumu/ui/components/scroll-area';
import { Switch } from '@yasumu/ui/components/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yasumu/ui/components/select';
import { Separator } from '@yasumu/ui/components/separator';
import { Button } from '@yasumu/ui/components/button';
import { BookOpen, ExternalLink, RotateCcw, X } from 'lucide-react';
import { YASUMU_ANALYTICS_FLAG_KEY } from '@/lib/constants/instrumentation';
import { useCustomTheme } from '@/components/providers/custom-theme-provider';
import { YasumuThemes } from '@/lib/constants/themes';
import SettingsSection from './_components/settings-section';
import SettingItem from './_components/setting-item';
import { useMounted } from '@yasumu/ui/hooks/use-mounted';
import { SiGithub } from 'react-icons/si';
import { useRouter } from 'next/navigation';
import {
  getVersion,
  getTauriVersion,
  getIdentifier,
  getName,
  getBundleType,
  BundleType,
} from '@tauri-apps/api/app';

interface SettingsState {
  analyticsEnabled: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
  analyticsEnabled: true,
};

async function getStore() {
  return Store.load('yasumu-config.json').catch(() => null);
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const { allThemes, activeCustomTheme, setActiveCustomTheme } =
    useCustomTheme();
  const mounted = useMounted();
  const router = useRouter();
  const [appInfo, setAppInfo] = useState<{
    name: string;
    version: string;
    tauriVersion: string;
    identifier: string;
    bundleType: BundleType;
  } | null>(null);

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

  const handleThemeChange = useCallback(
    (value: string) => {
      const isDefaultTheme = value in YasumuThemes;
      if (isDefaultTheme) {
        setActiveCustomTheme(null);
        setTheme(value);
      } else {
        const customTheme = allThemes.find((t) => t.id === value);
        if (customTheme) {
          setTheme(customTheme.type);
          setActiveCustomTheme(value);
        }
      }
    },
    [allThemes, setActiveCustomTheme, setTheme],
  );

  const getCurrentThemeValue = useCallback(() => {
    if (activeCustomTheme) return activeCustomTheme;
    return theme ?? 'system';
  }, [activeCustomTheme, theme]);

  const lightThemes = allThemes.filter((t) => t.type === 'light');
  const darkThemes = allThemes.filter((t) => t.type === 'dark');

  if (!mounted || isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-row items-center justify-center w-full h-screen bg-background">
      <ScrollArea className="w-full h-full">
        <div className="p-6 max-w-3xl mx-auto">
          <div className="flex flex-row justify-between">
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Configure application preferences
              </p>
            </div>
            <Button
              variant="outline"
              className="cursor-pointer"
              size="sm"
              onClick={() => router.back()}
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="space-y-6">
            <SettingsSection
              title="Appearance"
              description="Customize the look and feel"
            >
              <SettingItem
                label="Theme"
                description="Choose your preferred color theme"
              >
                <Select
                  value={getCurrentThemeValue()}
                  onValueChange={handleThemeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>

                    {lightThemes.length > 0 && (
                      <>
                        <Separator className="my-1" />
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          Light Themes
                        </div>
                        {lightThemes.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </>
                    )}

                    {darkThemes.length > 0 && (
                      <>
                        <Separator className="my-1" />
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          Dark Themes
                        </div>
                        {darkThemes.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </SettingItem>
            </SettingsSection>

            <Separator />

            <SettingsSection
              title="Privacy"
              description="Control how Yasumu collects and uses data"
            >
              <SettingItem
                label="Usage Analytics"
                description="Help improve Yasumu by sending anonymous usage data"
              >
                <Switch
                  checked={settings.analyticsEnabled}
                  onCheckedChange={(value) =>
                    updateSetting('analyticsEnabled', value)
                  }
                />
              </SettingItem>
              <div className="text-xs text-muted-foreground pl-1">
                Analytics help us understand how Yasumu is used and identify
                issues. No personal data or request contents are collected.
                Changes take effect after restart.
              </div>
            </SettingsSection>

            <Separator />

            <SettingsSection
              title="About"
              description="Application information"
            >
              {[
                {
                  label: 'Version',
                  description: 'Current application version',
                  value: appInfo?.version ?? 'N/A',
                },
                {
                  label: 'Tauri Version',
                  description: 'Current Tauri version',
                  value: appInfo?.tauriVersion ?? 'N/A',
                },
                {
                  label: 'Identifier',
                  description: 'Current application identifier',
                  value: appInfo?.identifier ?? 'N/A',
                },
                {
                  label: 'Bundle Type',
                  description: 'Current application bundle type',
                  value: appInfo?.bundleType ?? 'N/A',
                },
              ].map((item) => (
                <SettingItem
                  key={item.label}
                  label={item.label}
                  description={item.description}
                  className="m-0"
                >
                  <div className="text-sm font-mono text-muted-foreground">
                    {item.value}
                  </div>
                </SettingItem>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://yasumu.dev/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BookOpen className="size-4" />
                    Documentation
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://github.com/neplextech/yasumu"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SiGithub className="size-4" />
                    GitHub
                  </a>
                </Button>
              </div>
            </SettingsSection>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
