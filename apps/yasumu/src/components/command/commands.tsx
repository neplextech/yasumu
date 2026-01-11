'use client';

import type React from 'react';
import type { HotkeyCallback } from 'react-hotkeys-hook';

export interface CommandShortcut {
  hotkey: string;
  mac: string[];
  other: string[];
}

export interface YasumuCommand {
  id: string;
  name: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: CommandShortcut;
  keywords?: string[];
  category?: string;
  disableShortcutRegistration?: boolean;
  execute: () => void | Promise<void>;
}

export interface YasumuCommandCategory {
  id: string;
  name: string;
  priority?: number;
}

export const CommandCategories: YasumuCommandCategory[] = [
  { id: 'navigation', name: 'Navigation', priority: 1 },
  { id: 'workspace', name: 'Workspace', priority: 2 },
  { id: 'appearance', name: 'Appearance', priority: 3 },
  { id: 'general', name: 'General', priority: 4 },
];

export function getCategoryPriority(categoryId?: string): number {
  if (!categoryId) return 999;
  const category = CommandCategories.find((c) => c.id === categoryId);
  return category?.priority ?? 999;
}

export function createShortcutMatcher(
  shortcut: CommandShortcut,
): (...args: Parameters<HotkeyCallback>) => boolean {
  return (_, { hotkey }) => hotkey.toString() === shortcut.hotkey;
}

export function formatShortcutDisplay(
  shortcut: CommandShortcut,
  isMac: boolean,
): string {
  const keys = isMac ? shortcut.mac : shortcut.other;
  return keys.join('+');
}
