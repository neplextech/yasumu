'use client';

import { useState, useMemo } from 'react';
import { useMounted } from '@yasumu/ui/hooks/use-mounted';
import { useTheme } from 'next-themes';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@yasumu/ui/components/dropdown-menu';
import { Input } from '@yasumu/ui/components/input';
import { Palette, Moon, Sun, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { YasumuThemes, getCustomThemeIcon } from '@/lib/constants/themes';
import { useCustomTheme } from '@/components/providers/custom-theme-provider';
import type { YasumuThemeConfig } from '@/lib/types/theme';

interface ThemeItemProps {
  name: string;
  id?: string;
  icon: LucideIcon;
  checked: boolean;
  onSelect: () => void;
}

function ThemeItem({
  name,
  id,
  icon: Icon,
  checked,
  onSelect,
}: ThemeItemProps) {
  return (
    <DropdownMenuCheckboxItem
      checked={checked}
      onCheckedChange={onSelect}
      className="gap-2"
    >
      <Icon className="size-4" />
      <div className="flex flex-col">
        <span>{name}</span>
        {id && (
          <span className="text-xs text-muted-foreground font-mono">{id}</span>
        )}
      </div>
    </DropdownMenuCheckboxItem>
  );
}

interface ThemeSectionProps {
  title: string;
  icon: LucideIcon;
  themes: YasumuThemeConfig[];
  activeCustomTheme: string | null;
  themeIcon: LucideIcon;
  onThemeSelect: (themeId: string, themeType: string) => void;
}

function ThemeSection({
  title,
  icon: SectionIcon,
  themes,
  activeCustomTheme,
  themeIcon,
  onThemeSelect,
}: ThemeSectionProps) {
  if (themes.length === 0) return null;

  return (
    <>
      <DropdownMenuSeparator />
      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
        <SectionIcon className="mr-1 inline size-3" />
        {title}
      </div>
      {themes.map((theme) => (
        <ThemeItem
          key={theme.id}
          name={theme.name}
          id={theme.id}
          icon={themeIcon}
          checked={activeCustomTheme === theme.id}
          onSelect={() => onThemeSelect(theme.id, theme.type)}
        />
      ))}
    </>
  );
}

export default function SidebarThemeSelector() {
  const { setTheme, theme } = useTheme();
  const { allThemes, activeCustomTheme, setActiveCustomTheme } =
    useCustomTheme();
  const mounted = useMounted();
  const [searchQuery, setSearchQuery] = useState('');

  const handleDefaultThemeSelect = (themeValue: string) => {
    setActiveCustomTheme(null);
    setTheme(themeValue);
  };

  const handleCustomThemeSelect = (themeId: string, themeType: string) => {
    setTheme(themeType);
    setActiveCustomTheme(themeId);
  };

  const CustomIcon = getCustomThemeIcon();

  const filteredDefaultThemes = useMemo(() => {
    if (!searchQuery) return Object.entries(YasumuThemes);
    const query = searchQuery.toLowerCase();
    return Object.entries(YasumuThemes).filter(
      ([key, t]) =>
        t.name.toLowerCase().includes(query) ||
        key.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const filteredCustomThemes = useMemo(() => {
    if (!searchQuery) return allThemes;
    const query = searchQuery.toLowerCase();
    return allThemes.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query),
    );
  }, [searchQuery, allThemes]);

  const lightThemes = useMemo(
    () => filteredCustomThemes.filter((t) => t.type === 'light'),
    [filteredCustomThemes],
  );

  const darkThemes = useMemo(
    () => filteredCustomThemes.filter((t) => t.type === 'dark'),
    [filteredCustomThemes],
  );

  if (!mounted) return null;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="gap-2">
        <Palette className="size-4" />
        Themes
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="max-h-80 w-56 overflow-y-auto">
          <div className="sticky top-0 z-10 bg-popover p-1.5 pb-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search themes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>

          {filteredDefaultThemes.map(([key, targetTheme]) => (
            <ThemeItem
              key={key}
              name={targetTheme.name}
              icon={targetTheme.icon}
              checked={theme === key && !activeCustomTheme}
              onSelect={() => handleDefaultThemeSelect(key)}
            />
          ))}

          <ThemeSection
            title="Dark Themes"
            icon={Moon}
            themes={darkThemes}
            activeCustomTheme={activeCustomTheme}
            themeIcon={CustomIcon}
            onThemeSelect={handleCustomThemeSelect}
          />

          <ThemeSection
            title="Light Themes"
            icon={Sun}
            themes={lightThemes}
            activeCustomTheme={activeCustomTheme}
            themeIcon={CustomIcon}
            onThemeSelect={handleCustomThemeSelect}
          />

          {filteredDefaultThemes.length === 0 &&
            lightThemes.length === 0 &&
            darkThemes.length === 0 && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No themes found
              </div>
            )}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
