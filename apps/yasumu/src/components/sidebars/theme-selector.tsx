'use client';
import { useMounted } from '@yasumu/ui/hooks/use-mounted';
import { useTheme } from 'next-themes';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@yasumu/ui/components/dropdown-menu';
import { Palette } from 'lucide-react';
import { YasumuThemes } from '@/lib/constants/themes';

export default function SidebarThemeSelector() {
  const { setTheme, theme, themes } = useTheme();
  const mounted = useMounted();

  if (!mounted) return null;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="gap-2">
        <Palette className="size-4" />
        Themes
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          {themes.map((value) => {
            const targetTheme =
              YasumuThemes[value as keyof typeof YasumuThemes];
            if (!targetTheme) return null;

            return (
              <DropdownMenuCheckboxItem
                key={targetTheme.value}
                checked={theme === value}
                onCheckedChange={() => {
                  setTheme(value);
                }}
                className="gap-2"
              >
                <targetTheme.icon className="size-4" />
                {targetTheme.name}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
