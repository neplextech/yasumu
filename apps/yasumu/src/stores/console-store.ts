'use client';

import { create } from 'zustand';

export interface ConsoleLogEntry {
  id: string;
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
}

interface ConsoleStore {
  logs: ConsoleLogEntry[];
  isOpen: boolean;
  addLog: (entry: Omit<ConsoleLogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
}

export const useConsoleStore = create<ConsoleStore>((set) => ({
  logs: [],
  isOpen: false,
  addLog: (entry) =>
    set((state) => ({
      logs: [
        ...state.logs,
        {
          ...entry,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          timestamp: new Date(),
        },
      ].slice(-500),
    })),
  clearLogs: () => set({ logs: [] }),
  setOpen: (open) => set({ isOpen: open }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}));
