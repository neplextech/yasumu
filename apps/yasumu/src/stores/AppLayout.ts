'use client';

import { persistentAtom } from '@nanostores/persistent';
import { YasumuLayout } from '@/lib/constants/layout';
import { useStore } from '@nanostores/react';

export const $appLayout = persistentAtom<YasumuLayout>(
  'app-layout',
  YasumuLayout.Default,
);

export function useLayout() {
  return useStore($appLayout) ?? YasumuLayout.Default;
}

export function setAppLayout(layout: YasumuLayout) {
  $appLayout.set(layout);
}
