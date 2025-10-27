import { Monitor, Moon, Sun } from 'lucide-react';

export const YasumuThemes = {
  light: {
    name: 'Light',
    value: 'light',
    icon: Sun,
  },
  dark: {
    name: 'Dark',
    value: 'dark',
    icon: Moon,
  },
  system: {
    name: 'System',
    value: 'system',
    icon: Monitor,
  },
} as const;
