'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Palette,
  FolderOpen,
  History,
  RefreshCw,
  Globe,
  Mail,
  Lock,
  Settings,
  Home,
  Save,
  RotateCcw,
  LogOut,
} from 'lucide-react';
import type { YasumuCommand } from './commands';
import { useCommandPalette, useRegisterCommands } from './command-context';
import { useYasumu } from '@/components/providers/workspace-provider';
import { open } from '@tauri-apps/plugin-dialog';
import { withErrorHandler } from '@yasumu/ui/lib/error-handler-callback';
import { toast } from '@yasumu/ui/components/sonner';
import { useHotkeys } from 'react-hotkeys-hook';
import { relaunch, exit } from '@tauri-apps/plugin-process';

export function useBuiltinCommands() {
  const router = useRouter();
  const { openSubDialog, setIsOpen } = useCommandPalette();
  const { yasumu } = useYasumu();

  const handleOpenWorkspace = React.useCallback(() => {
    setIsOpen(false);
    withErrorHandler(async () => {
      const folder = await open({
        canCreateDirectories: true,
        directory: true,
        multiple: false,
        title: 'Open Yasumu Workspace',
      });

      if (!folder) return;

      await yasumu.workspaces.create({
        name:
          folder.replaceAll('\\', '/').split('/').pop() ?? 'Untitled Workspace',
        metadata: {
          path: folder,
        },
      });
      window.location.reload();
    })();
  }, [yasumu, setIsOpen]);

  const commands = React.useMemo((): YasumuCommand[] => {
    return [
      {
        id: 'change-theme',
        name: 'Set Color Theme',
        description: 'Change the application color theme',
        icon: <Palette className="size-4" />,
        keywords: ['theme', 'color', 'appearance', 'dark', 'light'],
        category: 'appearance',
        execute: () => {
          openSubDialog('theme-picker');
        },
      },
      {
        id: 'go-home',
        name: 'Go to Home',
        description: 'Navigate to home screen',
        icon: <Home className="size-4" />,
        keywords: ['home', 'start', 'welcome'],
        category: 'navigation',
        execute: () => {
          setIsOpen(false);
          router.push('/');
        },
      },
      {
        id: 'go-rest',
        name: 'Go to REST API',
        description: 'Navigate to REST API client',
        icon: <Globe className="size-4" />,
        keywords: ['rest', 'api', 'http', 'request'],
        category: 'navigation',
        execute: () => {
          setIsOpen(false);
          router.push('/en/workspaces/default/rest');
        },
      },
      {
        id: 'go-emails',
        name: 'Go to Emails',
        description: 'Navigate to email testing',
        icon: <Mail className="size-4" />,
        keywords: ['email', 'smtp', 'mail', 'mailbox'],
        category: 'navigation',
        execute: () => {
          setIsOpen(false);
          router.push('/en/workspaces/default/emails');
        },
      },
      {
        id: 'go-environment',
        name: 'Go to Environment',
        description: 'Navigate to environment variables',
        icon: <Lock className="size-4" />,
        keywords: ['environment', 'variables', 'secrets', 'env'],
        category: 'navigation',
        execute: () => {
          setIsOpen(false);
          router.push('/en/workspaces/default/environment');
        },
      },
      {
        id: 'go-settings',
        name: 'Go to Settings',
        description: 'Open application settings',
        icon: <Settings className="size-4" />,
        keywords: ['settings', 'preferences', 'options', 'config'],
        category: 'navigation',
        shortcut: {
          hotkey: 'mod+,',
          mac: ['⌘', ','],
          other: ['Ctrl', ','],
        },
        execute: () => {
          setIsOpen(false);
          router.push('/en/settings');
        },
      },
      {
        id: 'open-workspace',
        name: 'Open Workspace',
        description: 'Open or create a new workspace',
        icon: <FolderOpen className="size-4" />,
        keywords: ['open', 'workspace', 'folder', 'project', 'new'],
        category: 'workspace',
        execute: handleOpenWorkspace,
      },
      {
        id: 'open-recent',
        name: 'Open Recent Workspace',
        description: 'Open a recently used workspace',
        icon: <History className="size-4" />,
        keywords: ['recent', 'history', 'workspace'],
        category: 'workspace',
        execute: () => {
          setIsOpen(false);
          router.push('/');
        },
      },
      {
        id: 'save-workspace',
        name: 'Save Workspace',
        description: 'Save the current workspace',
        icon: <Save className="size-4" />,
        keywords: ['save', 'workspace', 'project', 'collection'],
        category: 'workspace',
        shortcut: {
          hotkey: 'mod+s',
          mac: ['⌘', 'S'],
          other: ['Ctrl', 'S'],
        },
        execute: () => {
          setIsOpen(false);
          const workspace = yasumu.workspaces.getActiveWorkspace();
          if (!workspace) return;

          withErrorHandler(async () => {
            const savingToast = toast.loading('Saving workspace...');
            await workspace.synchronize();
            toast.dismiss(savingToast);
            toast.success('Workspace saved successfully!');
          })();
        },
      },
      {
        id: 'reload-window',
        name: 'Reload Window',
        description: 'Reload the application window',
        icon: <RefreshCw className="size-4" />,
        shortcut: {
          hotkey: 'mod+r',
          mac: ['⌘', 'R'],
          other: ['Ctrl', 'R'],
        },
        keywords: ['reload', 'refresh', 'restart'],
        category: 'general',
        execute: () => {
          window.location.reload();
        },
      },
      {
        id: 'relaunch-application',
        name: 'Relaunch Application',
        description: 'Relaunch the application',
        icon: <RotateCcw className="size-4" />,
        keywords: ['relaunch', 'restart', 'reload'],
        category: 'general',
        execute: () => {
          withErrorHandler(async () => {
            await relaunch();
          })();
        },
      },
      {
        id: 'exit-application',
        name: 'Quit Application',
        description: 'Quit the application',
        icon: <LogOut className="size-4" />,
        keywords: ['exit', 'quit', 'close'],
        category: 'general',
        execute: () => {
          withErrorHandler(async () => {
            await exit();
          })();
        },
      },
    ];
  }, [router, openSubDialog, handleOpenWorkspace, setIsOpen]);

  useRegisterCommands(commands);
}

export function BuiltinCommandsRegistrar() {
  useBuiltinCommands();

  return null;
}
