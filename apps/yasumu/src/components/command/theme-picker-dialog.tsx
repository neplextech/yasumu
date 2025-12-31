'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { useCustomTheme } from '@/components/providers/custom-theme-provider';
import { YasumuThemes } from '@/lib/constants/themes';
import type { YasumuThemeConfig } from '@/lib/types/theme';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@yasumu/ui/components/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@yasumu/ui/components/dialog';
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
  const [confirmed, setConfirmed] = React.useState(false);

  const isOpen = activeSubDialog === 'theme-picker';

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

  const themeOptionsMap = React.useMemo(() => {
    const map = new Map<string, ThemeOption>();
    for (const option of allThemeOptions) {
      const value = option.isDefault
        ? `${option.name} ${option.id}`
        : `${option.name} ${option.id} ${option.type}`;
      map.set(value, option);
    }
    return map;
  }, [allThemeOptions]);

  React.useEffect(() => {
    if (isOpen) {
      setOriginalTheme(currentNextTheme ?? 'system');
      setOriginalCustomTheme(activeCustomTheme);
      setConfirmed(false);
    }
  }, [isOpen, currentNextTheme, activeCustomTheme]);

  const revertTheme = React.useCallback(() => {
    if (originalTheme) {
      setTheme(originalTheme);
      setActiveCustomTheme(originalCustomTheme);
    }
  }, [originalTheme, originalCustomTheme, setTheme, setActiveCustomTheme]);

  const handleClose = React.useCallback(
    (open: boolean) => {
      if (!open) {
        if (!confirmed) {
          revertTheme();
        }
        closeSubDialog();
      }
    },
    [confirmed, revertTheme, closeSubDialog],
  );

  const applyTheme = React.useCallback(
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

  const handleValueChange = React.useCallback(
    (value: string) => {
      const option = themeOptionsMap.get(value);
      if (option) {
        applyTheme(option);
      }
    },
    [themeOptionsMap, applyTheme],
  );

  const handleSelect = React.useCallback(
    (option: ThemeOption) => {
      applyTheme(option);
      setConfirmed(true);
      closeSubDialog();
      setIsOpen(false);
    },
    [applyTheme, closeSubDialog, setIsOpen],
  );

  const getIcon = (option: ThemeOption) => {
    if (option.isDefault) {
      if (option.id === 'light') return <Sun className="size-4" />;
      if (option.id === 'dark') return <Moon className="size-4" />;
      if (option.id === 'system') return <Monitor className="size-4" />;
    }
    return <Palette className="size-4" />;
  };

  const isSelected = React.useCallback(
    (option: ThemeOption) => {
      if (!originalTheme) return false;
      if (option.isDefault) {
        return originalTheme === option.id && !originalCustomTheme;
      }
      return originalCustomTheme === option.id;
    },
    [originalTheme, originalCustomTheme],
  );

  const defaultThemes = allThemeOptions.filter((t) => t.isDefault);
  const darkThemes = allThemeOptions.filter(
    (t) => !t.isDefault && t.type === 'dark',
  );
  const lightThemes = allThemeOptions.filter(
    (t) => !t.isDefault && t.type === 'light',
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogHeader className="sr-only">
        <DialogTitle>Theme Picker</DialogTitle>
        <DialogDescription>Select a theme for Yasumu</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0" showCloseButton={false}>
        <Command
          className="[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
          onValueChange={handleValueChange}
        >
          <CommandInput placeholder="Search themes..." />
          <CommandList>
            <CommandEmpty>No themes found.</CommandEmpty>
            <CommandGroup heading="Default">
              {defaultThemes.map((option) => (
                <CommandItem
                  key={option.id}
                  value={`${option.name} ${option.id}`}
                  onSelect={() => handleSelect(option)}
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
        </Command>
      </DialogContent>
    </Dialog>
  );
}
