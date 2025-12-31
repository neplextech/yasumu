'use client';

import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@yasumu/ui/components/dialog';
import { DropdownMenuItem } from '@yasumu/ui/components/dropdown-menu';
import { useCommandPalette } from '@/components/command';
import { CommandCategories, getCategoryPriority } from '@/components/command';
import { usePlatform } from '@/hooks/use-platform';
import { useState, useMemo } from 'react';

function ShortcutKey({ keyName }: { keyName: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-medium bg-muted border border-border rounded shadow-sm">
      {keyName}
    </kbd>
  );
}

interface ShortcutRowProps {
  name: string;
  description?: string;
  keys: string[];
}

function ShortcutRow({ name, description, keys }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{name}</span>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <div key={`${key}-${index}`} className="flex items-center gap-1">
            <ShortcutKey keyName={key} />
            {index < keys.length - 1 && (
              <span className="text-xs text-muted-foreground">+</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function KeyboardShortcutsDialog() {
  const { isMac } = usePlatform();
  const { commands } = useCommandPalette();
  const [open, setOpen] = useState(false);

  const commandsWithShortcuts = useMemo(() => {
    return commands.filter((cmd) => cmd.shortcut);
  }, [commands]);

  const groupedShortcuts = useMemo(() => {
    const groups: Record<
      string,
      Array<{ name: string; description?: string; keys: string[] }>
    > = {};

    for (const command of commandsWithShortcuts) {
      if (!command.shortcut) continue;

      const category = command.category ?? 'general';
      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push({
        name: command.name,
        description: command.description,
        keys: isMac ? command.shortcut.mac : command.shortcut.other,
      });
    }

    groups['general'] = groups['general'] ?? [];
    groups['general'].unshift({
      name: 'Command Palette',
      description: 'Open the command palette',
      keys: isMac ? ['⌘', 'K'] : ['Ctrl', 'K'],
    });

    return Object.entries(groups)
      .sort(([a], [b]) => getCategoryPriority(a) - getCategoryPriority(b))
      .map(([categoryId, shortcuts]) => {
        const category = CommandCategories.find((c) => c.id === categoryId);
        return {
          id: categoryId,
          name: category?.name ?? categoryId,
          shortcuts,
        };
      })
      .filter((group) => group.shortcuts.length > 0);
  }, [commandsWithShortcuts, isMac]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Keyboard />
          Keyboard Shortcuts
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="size-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Quick reference for available keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {groupedShortcuts.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No keyboard shortcuts available
            </div>
          ) : (
            groupedShortcuts.map((group) => (
              <div key={group.id} className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3">
                  {group.name}
                </h3>
                <div className="space-y-1">
                  {group.shortcuts.map((shortcut) => (
                    <ShortcutRow
                      key={shortcut.name}
                      name={shortcut.name}
                      description={shortcut.description}
                      keys={shortcut.keys}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
