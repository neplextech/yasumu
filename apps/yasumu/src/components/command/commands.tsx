'use client';

import type React from 'react';

export interface YasumuCommand {
  id: string;
  name: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  keywords?: string[];
  category?: string;
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
