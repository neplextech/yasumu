'use client';

import { useEffect, useState } from 'react';
import { Keyboard } from 'lucide-react';
import { platform } from '@tauri-apps/plugin-os';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@yasumu/ui/components/dialog';
import { DropdownMenuItem } from '@yasumu/ui/components/dropdown-menu';

interface KeyboardShortcut {
  action: string;
  description: string;
  keys: {
    mac: string[];
    other: string[];
  };
}

interface ShortcutGroup {
  name: string;
  shortcuts: KeyboardShortcut[];
}

const KEYBOARD_SHORTCUTS: ShortcutGroup[] = [
  {
    name: 'Workspace',
    shortcuts: [
      {
        action: 'Save',
        description: 'Save current workspace',
        keys: {
          mac: ['⌘', 'S'],
          other: ['Ctrl', 'S'],
        },
      },
    ],
  },
];

function ShortcutKey({ keyName }: { keyName: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-medium bg-muted border border-border rounded shadow-sm">
      {keyName}
    </kbd>
  );
}

function ShortcutRow({
  shortcut,
  isMac,
}: {
  shortcut: KeyboardShortcut;
  isMac: boolean;
}) {
  const keys = isMac ? shortcut.keys.mac : shortcut.keys.other;

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{shortcut.action}</span>
        <span className="text-xs text-muted-foreground">
          {shortcut.description}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <div key={key} className="flex items-center gap-1">
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
  const [isMac, setIsMac] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const getPlatform = async () => {
      try {
        const platformName = await platform();
        setIsMac(platformName === 'macos');
      } catch {
        setIsMac(false);
      }
    };
    getPlatform();
  }, []);

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
          {KEYBOARD_SHORTCUTS.map((group) => (
            <div key={group.name} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3">
                {group.name}
              </h3>
              <div className="space-y-1">
                {group.shortcuts.map((shortcut) => (
                  <ShortcutRow
                    key={shortcut.action}
                    shortcut={shortcut}
                    isMac={isMac}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
