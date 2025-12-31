'use client';

import * as React from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@yasumu/ui/components/command';
import { useCommandPalette } from './command-context';
import {
  CommandCategories,
  formatShortcutDisplay,
  getCategoryPriority,
} from './commands';
import { ThemePickerDialog } from './theme-picker-dialog';
import { BuiltinCommandsRegistrar } from './use-builtin-commands';
import { usePlatform } from '@/hooks/use-platform';

export function CommandPalette() {
  const { isOpen, setIsOpen, commands, activeSubDialog } = useCommandPalette();
  const { isMac } = usePlatform();

  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, typeof commands> = {};

    for (const command of commands) {
      const category = command.category ?? 'general';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(command);
    }

    return Object.entries(groups)
      .sort(([a], [b]) => getCategoryPriority(a) - getCategoryPriority(b))
      .map(([categoryId, cmds]) => {
        const category = CommandCategories.find((c) => c.id === categoryId);
        return {
          id: categoryId,
          name: category?.name ?? categoryId,
          commands: cmds,
        };
      });
  }, [commands]);

  const handleSelect = React.useCallback((command: (typeof commands)[0]) => {
    command.execute();
  }, []);

  if (activeSubDialog) {
    return (
      <>
        <BuiltinCommandsRegistrar />
        <ThemePickerDialog />
      </>
    );
  }

  return (
    <>
      <BuiltinCommandsRegistrar />
      <ThemePickerDialog />
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {groupedCommands.map((group) => (
            <CommandGroup key={group.id} heading={group.name}>
              {group.commands.map((command) => (
                <CommandItem
                  key={command.id}
                  value={`${command.name} ${command.keywords?.join(' ') ?? ''}`}
                  onSelect={() => handleSelect(command)}
                  className="flex items-center gap-2"
                >
                  {command.icon}
                  <div className="flex flex-col flex-1">
                    <span>{command.name}</span>
                    {command.description && (
                      <span className="text-xs text-muted-foreground">
                        {command.description}
                      </span>
                    )}
                  </div>
                  {command.shortcut && (
                    <CommandShortcut>
                      {formatShortcutDisplay(command.shortcut, isMac)}
                    </CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
