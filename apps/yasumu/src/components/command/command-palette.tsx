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
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';

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

  React.useEffect(() => {
    const controller = new AbortController();

    /**
     * Turns a keyboard event into a normalized hotkey string, like "mod+r" or "ctrl+shift+o"
     */
    function eventToHotkey(event: KeyboardEvent) {
      const keys = [];

      // On Mac, 'metaKey' is ⌘, and is commonly the 'mod' key
      // On Windows/Linux, 'ctrlKey' is commonly the 'mod' key
      if (event.metaKey) {
        keys.push('mod');
      } else if (event.ctrlKey) {
        keys.push('ctrl');
      }
      if (event.altKey) keys.push('alt');
      if (event.shiftKey) keys.push('shift');

      // The 'key' property can be case-sensitive and include things like 'ArrowUp'
      // For letters, normalize to lower-case
      // We want things like 'mod+r', 'ctrl+shift+o'
      let key = event.key.toLowerCase();

      // Handle special keys, e.g., ' ' -> 'space'
      if (key === ' ') key = 'space';
      if (key === 'arrowup') key = 'up';
      if (key === 'arrowdown') key = 'down';
      if (key === 'arrowleft') key = 'left';
      if (key === 'arrowright') key = 'right';

      keys.push(key);
      return keys.join('+');
    }

    document.addEventListener(
      'keydown',
      (event) => {
        console.log('keydown', event);
        if (!commands.length) return;

        const pressedHotkey = eventToHotkey(event);

        // Try to match command.shortcut.hotkey (which should also be in normalized "mod+r" format)
        const shortcut = commands.find(
          (cmd) =>
            cmd.shortcut &&
            // Exact match
            (pressedHotkey === cmd.shortcut.hotkey.toLowerCase() ||
              // Allow for "mod" mapping to "ctrl" on non-Mac if needed in the data
              pressedHotkey.replace(/^mod/i, 'ctrl') ===
                cmd.shortcut.hotkey.toLowerCase()),
        );
        if (shortcut) {
          event.preventDefault();
          withErrorHandler(async () => shortcut.execute())();
        }
      },
      {
        signal: controller.signal,
      },
    );

    return () => {
      controller.abort();
    };
  }, [commands]);

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
