'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@yasumu/ui/components/dialog';
import { DropdownMenuItem } from '@yasumu/ui/components/dropdown-menu';
import { Keyboard } from 'lucide-react';
import { useState, useMemo } from 'react';

import { useCommandPalette } from '@/components/command';
import { CommandCategories, getCategoryPriority } from '@/components/command';
import { usePlatform } from '@/hooks/use-platform';

function ShortcutKey({ keyName }: { keyName: string }) {
  return (
    <kbd className="bg-muted border-border inline-flex h-6 min-w-[24px] items-center justify-center rounded border px-1.5 text-xs font-medium shadow-sm">
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
    <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg px-3 py-2 transition-colors">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{name}</span>
        {description && <span className="text-muted-foreground text-xs">{description}</span>}
      </div>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <div key={`${key}-${index}`} className="flex items-center gap-1">
            <ShortcutKey keyName={key} />
            {index < keys.length - 1 && <span className="text-muted-foreground text-xs">+</span>}
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
    const groups: Record<string, Array<{ name: string; description?: string; keys: string[] }>> = {};

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

    (groups['general'] ??= []).unshift({
      name: 'Command Palette',
      description: 'Open the command palette',
      keys: isMac ? ['⌘', 'K'] : ['Ctrl', 'K'],
    });
    (groups['advanced'] ??= []).unshift(
      {
        name: 'Open Settings',
        description: 'Open the settings',
        keys: isMac ? ['⌘', ','] : ['Ctrl', ','],
      },
      {
        name: 'Open Devtools',
        description: 'Open the devtools',
        keys: isMac ? ['⌘', 'Shift', 'I'] : ['Ctrl', 'Shift', 'I'],
      },
    );

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
          <DialogDescription>Quick reference for available keyboard shortcuts</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
          {groupedShortcuts.length === 0 ? (
            <div className="text-muted-foreground py-4 text-center text-sm">No keyboard shortcuts available</div>
          ) : (
            groupedShortcuts.map((group) => (
              <div key={group.id} className="space-y-2">
                <h3 className="text-muted-foreground px-3 text-xs font-semibold tracking-wider uppercase">
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
