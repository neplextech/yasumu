'use client';

import * as React from 'react';
import type {
  YasumuThemeConfig,
  YasumuThemeVariables,
} from '@/lib/types/theme';
import { BUILTIN_THEMES } from '@/lib/constants/builtin-themes';

interface CustomThemeContextValue {
  customThemes: YasumuThemeConfig[];
  builtinThemes: YasumuThemeConfig[];
  allThemes: YasumuThemeConfig[];
  activeCustomTheme: string | null;
  setActiveCustomTheme: (themeId: string | null) => void;
  loadThemesFromJson: (json: string) => void;
  addTheme: (theme: YasumuThemeConfig) => void;
  removeTheme: (themeId: string) => void;
}

const CustomThemeContext = React.createContext<CustomThemeContextValue | null>(
  null,
);

const STORAGE_KEY = 'yasumu-custom-themes';
const ACTIVE_THEME_KEY = 'yasumu-active-custom-theme';
const STYLE_ELEMENT_ID = 'yasumu-custom-theme-styles';

function applyThemeVariables(variables: YasumuThemeVariables | null): void {
  let styleElement = document.getElementById(
    STYLE_ELEMENT_ID,
  ) as HTMLStyleElement | null;

  if (!variables) {
    if (styleElement) {
      styleElement.remove();
    }
    return;
  }

  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = STYLE_ELEMENT_ID;
    document.head.appendChild(styleElement);
  }

  const cssVariables = Object.entries(variables)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `--${key}: ${value};`)
    .join('\n  ');

  styleElement.textContent = `:root {\n  ${cssVariables}\n}`;
}

export function CustomThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [customThemes, setCustomThemes] = React.useState<YasumuThemeConfig[]>(
    [],
  );
  const [activeCustomTheme, setActiveCustomThemeState] = React.useState<
    string | null
  >(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    try {
      const storedThemes = localStorage.getItem(STORAGE_KEY);
      if (storedThemes) {
        setCustomThemes(JSON.parse(storedThemes));
      }

      const activeTheme = localStorage.getItem(ACTIVE_THEME_KEY);
      if (activeTheme) {
        setActiveCustomThemeState(activeTheme);
      }
    } catch {
      // Ignore storage errors
    }
    setIsInitialized(true);
  }, []);

  React.useEffect(() => {
    if (!isInitialized) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customThemes));
    } catch {
      // Ignore storage errors
    }
  }, [customThemes, isInitialized]);

  const allThemes = React.useMemo(
    () => [...BUILTIN_THEMES, ...customThemes],
    [customThemes],
  );

  React.useEffect(() => {
    if (!isInitialized) return;

    if (activeCustomTheme) {
      const theme = allThemes.find((t) => t.id === activeCustomTheme);
      if (theme) {
        applyThemeVariables(theme.variables);
        localStorage.setItem(ACTIVE_THEME_KEY, activeCustomTheme);
      } else {
        applyThemeVariables(null);
        localStorage.removeItem(ACTIVE_THEME_KEY);
        setActiveCustomThemeState(null);
      }
    } else {
      applyThemeVariables(null);
      localStorage.removeItem(ACTIVE_THEME_KEY);
    }
  }, [activeCustomTheme, allThemes, isInitialized]);

  const setActiveCustomTheme = React.useCallback((themeId: string | null) => {
    setActiveCustomThemeState(themeId);
  }, []);

  const loadThemesFromJson = React.useCallback((json: string) => {
    const parsed = JSON.parse(json);
    const themes: YasumuThemeConfig[] = Array.isArray(parsed)
      ? parsed
      : (parsed.themes ?? []);
    setCustomThemes((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newThemes = themes.filter((t) => !existingIds.has(t.id));
      return [...prev, ...newThemes];
    });
  }, []);

  const addTheme = React.useCallback((theme: YasumuThemeConfig) => {
    setCustomThemes((prev) => {
      if (prev.some((t) => t.id === theme.id)) {
        return prev.map((t) => (t.id === theme.id ? theme : t));
      }
      return [...prev, theme];
    });
  }, []);

  const removeTheme = React.useCallback(
    (themeId: string) => {
      setCustomThemes((prev) => prev.filter((t) => t.id !== themeId));
      if (activeCustomTheme === themeId) {
        setActiveCustomThemeState(null);
      }
    },
    [activeCustomTheme],
  );

  const value = React.useMemo(
    () => ({
      customThemes,
      builtinThemes: BUILTIN_THEMES,
      allThemes,
      activeCustomTheme,
      setActiveCustomTheme,
      loadThemesFromJson,
      addTheme,
      removeTheme,
    }),
    [
      customThemes,
      allThemes,
      activeCustomTheme,
      setActiveCustomTheme,
      loadThemesFromJson,
      addTheme,
      removeTheme,
    ],
  );

  return (
    <CustomThemeContext.Provider value={value}>
      {children}
    </CustomThemeContext.Provider>
  );
}

export function useCustomTheme() {
  const context = React.useContext(CustomThemeContext);
  if (!context) {
    throw new Error('useCustomTheme must be used within a CustomThemeProvider');
  }
  return context;
}
