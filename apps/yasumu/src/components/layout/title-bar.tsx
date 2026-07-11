'use client';

import { getCurrentWindow } from '@tauri-apps/api/window';
import { platform } from '@tauri-apps/plugin-os';
import { cn } from '@yasumu/ui/lib/utils';
import { useEffect, useEffectEvent, useState } from 'react';
import { TbLayoutBottombarFilled, TbLayoutSidebarRightFilled } from 'react-icons/tb';
import { VscChromeClose, VscChromeMaximize, VscChromeMinimize, VscChromeRestore } from 'react-icons/vsc';

import { YasumuLayout } from '@/lib/constants/layout';
import { truncate } from '@/lib/utils/truncate';

import { useAppLayout } from '../providers/app-layout-provider';
import { useYasumu } from '../providers/workspace-provider';

export function TitleBar() {
  const [isMac, setIsMac] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const { yasumu } = useYasumu();
  const [title, setTitle] = useState('Yasumu');
  const { layout, setLayout } = useAppLayout();

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
    setLayout((prev) => (prev === YasumuLayout.Default ? YasumuLayout.Classic : YasumuLayout.Default));
  };

  return (
    <div
      className="bg-background z-50 flex h-[30px] shrink-0 items-center justify-between border-b select-none"
      data-tauri-drag-region
    >
      {/* Left Section */}
      <div className={cn('flex items-center h-full px-4', isMac && 'pl-[80px]')} data-tauri-drag-region>
        {isMac ? null : (
          <button
            className="text-muted-foreground hover:text-foreground p-1 transition-colors"
            onClick={toggleSidebarState}
          >
            {layout === YasumuLayout.Classic ? <TbLayoutBottombarFilled /> : <TbLayoutSidebarRightFilled />}
          </button>
        )}
      </div>

      {/* Center Section - Title */}
      <div
        className="text-muted-foreground pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-medium"
        data-tauri-drag-region
      >
        {title}
      </div>

      {/* Right Section */}
      <div className="flex h-full items-center" data-tauri-drag-region>
        {isMac ? (
          <div className="px-4">
            <button
              className="text-muted-foreground hover:text-foreground p-1 transition-colors"
              onClick={toggleSidebarState}
            >
              {layout === YasumuLayout.Classic ? <TbLayoutBottombarFilled /> : <TbLayoutSidebarRightFilled />}
            </button>
          </div>
        ) : (
          <div className="flex h-full">
            <button
              className="hover:bg-muted text-foreground inline-flex h-full w-[46px] items-center justify-center transition-colors"
              onClick={handleMinimize}
            >
              <VscChromeMinimize className="h-4 w-4" />
            </button>
            <button
              className="hover:bg-muted text-foreground inline-flex h-full w-[46px] items-center justify-center transition-colors"
              onClick={handleMaximize}
            >
              {isMaximized ? <VscChromeRestore className="h-4 w-4" /> : <VscChromeMaximize className="h-4 w-4" />}
            </button>
            <button
              className="hover:bg-destructive hover:text-destructive-foreground text-foreground inline-flex h-full w-[46px] items-center justify-center transition-colors"
              onClick={handleClose}
            >
              <VscChromeClose className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
