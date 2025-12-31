import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun, Palette } from 'lucide-react';

export interface BaseTheme {
  name: string;
  value: string;
  icon: LucideIcon;
  isCustom?: boolean;
}

export const YasumuThemes: Record<string, BaseTheme> = {
  light: {
    name: 'Default Light',
    value: 'light',
    icon: Sun,
  },
  dark: {
    name: 'Default Dark',
    value: 'dark',
    icon: Moon,
  },
  system: {
    name: 'System',
    value: 'system',
    icon: Monitor,
  },
};

export function getCustomThemeIcon(): LucideIcon {
  return Palette;
}
