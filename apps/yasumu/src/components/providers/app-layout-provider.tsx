'use client';
import { YasumuLayout } from '@/lib/constants/layout';
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';

export interface AppLayoutContextData {
  layout: YasumuLayout;
  setLayout: Dispatch<SetStateAction<YasumuLayout>>;
}

const AppLayoutContext = createContext<AppLayoutContextData | null>(null);

export function AppLayoutProvider({ children }: React.PropsWithChildren) {
  const [layout, setLayout] = useState<YasumuLayout>(YasumuLayout.Default);

  useEffect(() => {
    localStorage.setItem('yasumu:layout', layout);
  }, [layout]);

  return (
    <AppLayoutContext.Provider value={{ layout, setLayout }}>
      {children}
    </AppLayoutContext.Provider>
  );
}

export function useAppLayout() {
  const context = useContext(AppLayoutContext);
  if (!context) {
    throw new Error('useAppLayout must be used within a AppLayoutProvider');
  }
  return context;
}
