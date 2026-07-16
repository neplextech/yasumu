'use client';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@yasumu/ui/components/command';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import * as React from 'react';

import { usePlatform } from '@/hooks/use-platform';

import { useCommandPalette } from './command-context';
import { CommandCategories, formatShortcutDisplay, getCategoryPriority } from './commands';
import { ThemePickerDialog } from './theme-picker-dialog';
import { BuiltinCommandsRegistrar } from './use-builtin-commands';

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

      if ((isMac && event.metaKey) || (!isMac && event.ctrlKey)) {
        keys.push('mod');
      } else if (event.ctrlKey) {
        keys.push('ctrl');
      } else if (event.metaKey) {
        keys.push('meta');
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
        if (event.repeat) return;
        if (
          event.target instanceof HTMLElement &&
          event.target.closest('input, textarea, select, [contenteditable="true"], .monaco-editor, [role="dialog"]')
        ) {
          return;
        }
        if (!commands.length) return;

        const pressedHotkey = eventToHotkey(event);

        const shortcut = commands.find(
          (cmd) =>
            !cmd.disableShortcutRegistration && cmd.shortcut && pressedHotkey === cmd.shortcut.hotkey.toLowerCase(),
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
  }, [commands, isMac]);

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
                  <div className="flex flex-1 flex-col">
                    <span>{command.name}</span>
                    {command.description && (
                      <span className="text-muted-foreground text-xs">{command.description}</span>
                    )}
                  </div>
                  {command.shortcut && (
                    <CommandShortcut>{formatShortcutDisplay(command.shortcut, isMac)}</CommandShortcut>
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
