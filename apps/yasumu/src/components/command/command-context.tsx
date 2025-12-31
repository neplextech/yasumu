'use client';

import * as React from 'react';
import type { YasumuCommand } from './commands';

export type SubDialogType = 'theme-picker' | null;

interface CommandPaletteContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
  commands: YasumuCommand[];
  registerCommand: (command: YasumuCommand) => void;
  unregisterCommand: (commandId: string) => void;
  activeSubDialog: SubDialogType;
  openSubDialog: (dialog: SubDialogType) => void;
  closeSubDialog: () => void;
}

const CommandPaletteContext =
  React.createContext<CommandPaletteContextValue | null>(null);

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [commands, setCommands] = React.useState<YasumuCommand[]>([]);
  const [activeSubDialog, setActiveSubDialog] =
    React.useState<SubDialogType>(null);

  const toggle = React.useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const registerCommand = React.useCallback((command: YasumuCommand) => {
    setCommands((prev) => {
      const exists = prev.some((c) => c.id === command.id);
      if (exists) {
        return prev.map((c) => (c.id === command.id ? command : c));
      }
      return [...prev, command];
    });
  }, []);

  const unregisterCommand = React.useCallback((commandId: string) => {
    setCommands((prev) => prev.filter((c) => c.id !== commandId));
  }, []);

  const openSubDialog = React.useCallback((dialog: SubDialogType) => {
    setActiveSubDialog(dialog);
  }, []);

  const closeSubDialog = React.useCallback(() => {
    setActiveSubDialog(null);
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  const value = React.useMemo(
    () => ({
      isOpen,
      setIsOpen,
      toggle,
      commands,
      registerCommand,
      unregisterCommand,
      activeSubDialog,
      openSubDialog,
      closeSubDialog,
    }),
    [
      isOpen,
      toggle,
      commands,
      registerCommand,
      unregisterCommand,
      activeSubDialog,
      openSubDialog,
      closeSubDialog,
    ],
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const context = React.useContext(CommandPaletteContext);
  if (!context) {
    throw new Error(
      'useCommandPalette must be used within a CommandPaletteProvider',
    );
  }
  return context;
}

export function useRegisterCommand(command: YasumuCommand) {
  const { registerCommand, unregisterCommand } = useCommandPalette();

  React.useEffect(() => {
    registerCommand(command);
    return () => unregisterCommand(command.id);
  }, [command, registerCommand, unregisterCommand]);
}

export function useRegisterCommands(commands: YasumuCommand[]) {
  const { registerCommand, unregisterCommand } = useCommandPalette();

  React.useEffect(() => {
    commands.forEach((cmd) => registerCommand(cmd));
    return () => commands.forEach((cmd) => unregisterCommand(cmd.id));
  }, [commands, registerCommand, unregisterCommand]);
}
