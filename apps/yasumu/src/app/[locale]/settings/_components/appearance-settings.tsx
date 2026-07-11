'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@yasumu/ui/components/select';
import { Separator } from '@yasumu/ui/components/separator';
import { useTheme } from 'next-themes';
import { useCallback } from 'react';

import { useCustomTheme } from '@/components/providers/custom-theme-provider';
import { YasumuThemes } from '@/lib/constants/themes';

import SettingItem from './setting-item';
import SettingsSection from './settings-section';

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const { allThemes, activeCustomTheme, setActiveCustomTheme } = useCustomTheme();

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

  return (
    <SettingsSection title="Appearance" description="Customize the look and feel of Yasumu">
      <SettingItem label="Theme" description="Choose your preferred color theme">
        <Select value={getCurrentThemeValue()} onValueChange={handleThemeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>

            {darkThemes.length > 0 && (
              <>
                <Separator className="my-1" />
                <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">Dark Themes</div>
                {darkThemes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                    <span className="text-muted-foreground ml-2 text-xs">{t.id}</span>
                  </SelectItem>
                ))}
              </>
            )}

            {lightThemes.length > 0 && (
              <>
                <Separator className="my-1" />
                <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">Light Themes</div>
                {lightThemes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                    <span className="text-muted-foreground ml-2 text-xs">{t.id}</span>
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </SettingItem>
    </SettingsSection>
  );
}
