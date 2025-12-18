'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { platform } from '@tauri-apps/plugin-os';
import {
  TbLayoutBottombarFilled,
  TbLayoutSidebarRightFilled,
} from 'react-icons/tb';
import {
  VscChromeClose,
  VscChromeMaximize,
  VscChromeMinimize,
  VscChromeRestore,
} from 'react-icons/vsc';
import { cn } from '@yasumu/ui/lib/utils';
import { useYasumu } from '../providers/workspace-provider';
import { truncate } from '@/lib/utils/truncate';

export function TitleBar() {
  const [isMac, setIsMac] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [sidebarState, setSidebarState] = useState<'right' | 'bottom'>('right');
  const { yasumu } = useYasumu();
  const [title, setTitle] = useState('Yasumu');

  const getPlatform = useEffectEvent(async () => {
    const platformName = await platform();
    setIsMac(platformName === 'macos');
  });

  const getTitle = useEffectEvent(async () => {
    const workspace = yasumu.workspaces.getActiveWorkspace();
    const name = truncate(workspace?.name ?? 'Yasumu', 30);
    setTitle(name);
  });

  useEffect(() => {
    void getPlatform();
    void getTitle();

    const checkMaximized = async () => {
      try {
        const win = getCurrentWindow();
        setIsMaximized(await win.isMaximized());
      } catch (e) {
        console.error(e);
      }
    };
    checkMaximized();
  }, []);

  const handleMinimize = () => {
    getCurrentWindow().minimize();
  };

  const handleMaximize = async () => {
    const win = getCurrentWindow();
    await win.toggleMaximize();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    getCurrentWindow().close();
  };

  const toggleSidebarState = () => {
    setSidebarState((prev) => (prev === 'right' ? 'bottom' : 'right'));
  };

  return (
    <div
      className="h-[30px] flex items-center justify-between z-50 bg-background border-b select-none shrink-0"
      data-tauri-drag-region
    >
      {/* Left Section */}
      <div
        className={cn('flex items-center h-full px-4', isMac && 'pl-[80px]')}
        data-tauri-drag-region
      >
        {isMac ? null : (
          <button
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            onClick={toggleSidebarState}
          >
            {sidebarState === 'right' ? (
              <TbLayoutSidebarRightFilled />
            ) : (
              <TbLayoutBottombarFilled />
            )}
          </button>
        )}
      </div>

      {/* Center Section - Title */}
      <div
        className="absolute left-1/2 -translate-x-1/2 text-sm font-medium text-muted-foreground pointer-events-none"
        data-tauri-drag-region
      >
        {title}
      </div>

      {/* Right Section */}
      <div className="flex items-center h-full" data-tauri-drag-region>
        {isMac ? (
          <div className="px-4">
            <button
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              onClick={toggleSidebarState}
            >
              {sidebarState === 'right' ? (
                <TbLayoutSidebarRightFilled />
              ) : (
                <TbLayoutBottombarFilled />
              )}
            </button>
          </div>
        ) : (
          <div className="flex h-full">
            <button
              className="inline-flex items-center justify-center w-[46px] h-full hover:bg-muted transition-colors text-foreground"
              onClick={handleMinimize}
            >
              <VscChromeMinimize className="w-4 h-4" />
            </button>
            <button
              className="inline-flex items-center justify-center w-[46px] h-full hover:bg-muted transition-colors text-foreground"
              onClick={handleMaximize}
            >
              {isMaximized ? (
                <VscChromeRestore className="w-4 h-4" />
              ) : (
                <VscChromeMaximize className="w-4 h-4" />
              )}
            </button>
            <button
              className="inline-flex items-center justify-center w-[46px] h-full hover:bg-destructive hover:text-destructive-foreground transition-colors text-foreground"
              onClick={handleClose}
            >
              <VscChromeClose className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
