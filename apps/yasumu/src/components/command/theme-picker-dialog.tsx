'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { useCustomTheme } from '@/components/providers/custom-theme-provider';
import { YasumuThemes } from '@/lib/constants/themes';
import type { YasumuThemeConfig } from '@/lib/types/theme';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@yasumu/ui/components/command';
import { Check, Moon, Palette, Sun, Monitor } from 'lucide-react';
import { useCommandPalette } from './command-context';

interface ThemeOption {
  id: string;
  name: string;
  type: 'light' | 'dark' | 'system';
  isDefault?: boolean;
  config?: YasumuThemeConfig;
}

export function ThemePickerDialog() {
  const { activeSubDialog, closeSubDialog, setIsOpen } = useCommandPalette();
  const { theme: currentNextTheme, setTheme } = useTheme();
  const { allThemes, activeCustomTheme, setActiveCustomTheme } =
    useCustomTheme();

  const [originalTheme, setOriginalTheme] = React.useState<string | null>(null);
  const [originalCustomTheme, setOriginalCustomTheme] = React.useState<
    string | null
  >(null);
  const [previewedTheme, setPreviewedTheme] = React.useState<string | null>(
    null,
  );

  const isOpen = activeSubDialog === 'theme-picker';

  React.useEffect(() => {
    if (isOpen) {
      setOriginalTheme(currentNextTheme ?? 'system');
      setOriginalCustomTheme(activeCustomTheme);
      setPreviewedTheme(null);
    }
  }, [isOpen, currentNextTheme, activeCustomTheme]);

  const handleClose = React.useCallback(
    (open: boolean) => {
      if (!open) {
        if (originalTheme && !previewedTheme) {
          setTheme(originalTheme);
          setActiveCustomTheme(originalCustomTheme);
        }
        closeSubDialog();
      }
    },
    [
      originalTheme,
      originalCustomTheme,
      previewedTheme,
      setTheme,
      setActiveCustomTheme,
      closeSubDialog,
    ],
  );

  const allThemeOptions = React.useMemo((): ThemeOption[] => {
    const defaultThemes: ThemeOption[] = Object.entries(YasumuThemes).map(
      ([key, t]) => ({
        id: key,
        name: t.name,
        type: key as 'light' | 'dark' | 'system',
        isDefault: true,
      }),
    );

    const customThemeOptions: ThemeOption[] = allThemes.map((t) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      isDefault: false,
      config: t,
    }));

    return [...defaultThemes, ...customThemeOptions];
  }, [allThemes]);

  const handlePreview = React.useCallback(
    (option: ThemeOption) => {
      if (option.isDefault) {
        setActiveCustomTheme(null);
        setTheme(option.id);
      } else {
        setTheme(option.type);
        setActiveCustomTheme(option.id);
      }
    },
    [setTheme, setActiveCustomTheme],
  );

  const handleSelect = React.useCallback(
    (option: ThemeOption) => {
      handlePreview(option);
      setPreviewedTheme(option.id);
      closeSubDialog();
      setIsOpen(false);
    },
    [handlePreview, closeSubDialog, setIsOpen],
  );

  const getIcon = (option: ThemeOption) => {
    if (option.isDefault) {
      if (option.id === 'light') return <Sun className="size-4" />;
      if (option.id === 'dark') return <Moon className="size-4" />;
      if (option.id === 'system') return <Monitor className="size-4" />;
    }
    return <Palette className="size-4" />;
  };

  const isSelected = (option: ThemeOption) => {
    if (option.isDefault) {
      return currentNextTheme === option.id && !activeCustomTheme;
    }
    return activeCustomTheme === option.id;
  };

  const defaultThemes = allThemeOptions.filter((t) => t.isDefault);
  const darkThemes = allThemeOptions.filter(
    (t) => !t.isDefault && t.type === 'dark',
  );
  const lightThemes = allThemeOptions.filter(
    (t) => !t.isDefault && t.type === 'light',
  );

  return (
    <CommandDialog open={isOpen} onOpenChange={handleClose}>
      <CommandInput placeholder="Search themes..." />
      <CommandList>
        <CommandEmpty>No themes found.</CommandEmpty>
        <CommandGroup heading="Default">
          {defaultThemes.map((option) => (
            <CommandItem
              key={option.id}
              value={`${option.name} ${option.id}`}
              onSelect={() => handleSelect(option)}
              onMouseEnter={() => handlePreview(option)}
              className="flex items-center gap-2"
            >
              {getIcon(option)}
              <span className="flex-1">{option.name}</span>
              {isSelected(option) && <Check className="size-4" />}
            </CommandItem>
          ))}
        </CommandGroup>
        {darkThemes.length > 0 && (
          <CommandGroup heading="Dark Themes">
            {darkThemes.map((option) => (
              <CommandItem
                key={option.id}
                value={`${option.name} ${option.id} dark`}
                onSelect={() => handleSelect(option)}
                onMouseEnter={() => handlePreview(option)}
                className="flex items-center gap-2"
              >
                {getIcon(option)}
                <div className="flex flex-col flex-1">
                  <span>{option.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {option.id}
                  </span>
                </div>
                {isSelected(option) && <Check className="size-4" />}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {lightThemes.length > 0 && (
          <CommandGroup heading="Light Themes">
            {lightThemes.map((option) => (
              <CommandItem
                key={option.id}
                value={`${option.name} ${option.id} light`}
                onSelect={() => handleSelect(option)}
                onMouseEnter={() => handlePreview(option)}
                className="flex items-center gap-2"
              >
                {getIcon(option)}
                <div className="flex flex-col flex-1">
                  <span>{option.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {option.id}
                  </span>
                </div>
                {isSelected(option) && <Check className="size-4" />}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
