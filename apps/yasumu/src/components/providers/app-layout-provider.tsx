'use client';

import { createContext, Dispatch, SetStateAction, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';

import { YasumuLayout } from '@/lib/constants/layout';

const LAYOUT_STORAGE_KEY = 'yasumu:layout';
const LAYOUT_CHANGE_EVENT = 'yasumu:layout-change';

export interface AppLayoutContextData {
  layout: YasumuLayout;
  setLayout: Dispatch<SetStateAction<YasumuLayout>>;
}

const AppLayoutContext = createContext<AppLayoutContextData | null>(null);

function getSavedLayout(): YasumuLayout {
  const value = localStorage.getItem(LAYOUT_STORAGE_KEY);
  return value === YasumuLayout.Classic || value === YasumuLayout.Default ? value : YasumuLayout.Default;
}

function subscribeToLayout(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === LAYOUT_STORAGE_KEY) callback();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(LAYOUT_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(LAYOUT_CHANGE_EVENT, callback);
  };
}

export function AppLayoutProvider({ children }: React.PropsWithChildren) {
  const layout = useSyncExternalStore(subscribeToLayout, getSavedLayout, () => YasumuLayout.Default);
  const setLayout = useCallback<Dispatch<SetStateAction<YasumuLayout>>>((update) => {
    const currentLayout = getSavedLayout();
    const nextLayout = typeof update === 'function' ? update(currentLayout) : update;
    localStorage.setItem(LAYOUT_STORAGE_KEY, nextLayout);
    window.dispatchEvent(new Event(LAYOUT_CHANGE_EVENT));
  }, []);
  const value = useMemo(() => ({ layout, setLayout }), [layout, setLayout]);

  return <AppLayoutContext.Provider value={value}>{children}</AppLayoutContext.Provider>;
}

export function useAppLayout() {
  const context = useContext(AppLayoutContext);
  if (!context) throw new Error('useAppLayout must be used within an AppLayoutProvider');
  return context;
}
