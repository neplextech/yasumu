'use client';

import { getCurrentWindow } from '@tauri-apps/api/window';
import { platform } from '@tauri-apps/plugin-os';
import { cn } from '@yasumu/ui/lib/utils';
import { type ComponentProps, useEffect, useState } from 'react';
import { TbLayoutBottombarFilled, TbLayoutSidebarRightFilled } from 'react-icons/tb';
import { VscChromeClose, VscChromeMaximize, VscChromeMinimize, VscChromeRestore } from 'react-icons/vsc';

import { YasumuLayout } from '@/lib/constants/layout';
import { truncate } from '@/lib/utils/truncate';

import { useAppLayout } from '../providers/app-layout-provider';
import { useWorkspaceSession } from '../providers/workspace-provider';

function TitleBarButton({ label, className, children, ...props }: ComponentProps<'button'> & { label: string }) {
  return (
    <button
      {...props}
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TitleBar() {
  const [isMac, setIsMac] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const { currentWorkspace } = useWorkspaceSession();
  const { layout, setLayout } = useAppLayout();
  const title = truncate(currentWorkspace?.name ?? 'Yasumu', 30);

  useEffect(() => {
    const updatePlatform = async () => {
      try {
        const platformName = await platform();
        setIsMac(platformName === 'macos');
      } catch (error) {
        console.error(error);
      }
    };

    const checkMaximized = async () => {
      try {
        const win = getCurrentWindow();
        setIsMaximized(await win.isMaximized());
      } catch (e) {
        console.error(e);
      }
    };
    void updatePlatform();
    void checkMaximized();
  }, []);

  const handleMinimize = () => {
    void getCurrentWindow()
      .minimize()
      .catch((error: unknown) => console.error('Failed to minimize the window:', error));
  };

  const handleMaximize = async () => {
    try {
      const win = getCurrentWindow();
      await win.toggleMaximize();
      setIsMaximized(await win.isMaximized());
    } catch (error) {
      console.error('Failed to change the window size:', error);
    }
  };

  const handleClose = () => {
    void getCurrentWindow()
      .close()
      .catch((error: unknown) => console.error('Failed to close the window:', error));
  };

  const toggleSidebarState = () => {
    setLayout((prev) => (prev === YasumuLayout.Default ? YasumuLayout.Classic : YasumuLayout.Default));
  };

  const layoutToggleLabel = layout === YasumuLayout.Classic ? 'Switch to default layout' : 'Switch to classic layout';

  return (
    <div
      className="bg-background z-50 flex h-[30px] shrink-0 items-center justify-between border-b select-none"
      data-tauri-drag-region
    >
      <div className={cn('flex items-center h-full px-4', isMac && 'pl-[80px]')} data-tauri-drag-region>
        {isMac ? null : (
          <TitleBarButton
            label={layoutToggleLabel}
            className="text-muted-foreground hover:text-foreground p-1 transition-colors"
            onClick={toggleSidebarState}
          >
            {layout === YasumuLayout.Classic ? (
              <TbLayoutBottombarFilled aria-hidden="true" />
            ) : (
              <TbLayoutSidebarRightFilled aria-hidden="true" />
            )}
          </TitleBarButton>
        )}
      </div>

      <div
        className="text-muted-foreground pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-medium"
        data-tauri-drag-region
      >
        {title}
      </div>

      <div className="flex h-full items-center" data-tauri-drag-region>
        {isMac ? (
          <div className="px-4">
            <TitleBarButton
              label={layoutToggleLabel}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors"
              onClick={toggleSidebarState}
            >
              {layout === YasumuLayout.Classic ? (
                <TbLayoutBottombarFilled aria-hidden="true" />
              ) : (
                <TbLayoutSidebarRightFilled aria-hidden="true" />
              )}
            </TitleBarButton>
          </div>
        ) : (
          <div className="flex h-full">
            <TitleBarButton
              label="Minimize window"
              className="hover:bg-muted text-foreground inline-flex h-full w-[46px] items-center justify-center transition-colors"
              onClick={handleMinimize}
            >
              <VscChromeMinimize className="h-4 w-4" aria-hidden="true" />
            </TitleBarButton>
            <TitleBarButton
              label={isMaximized ? 'Restore window' : 'Maximize window'}
              className="hover:bg-muted text-foreground inline-flex h-full w-[46px] items-center justify-center transition-colors"
              onClick={handleMaximize}
            >
              {isMaximized ? (
                <VscChromeRestore className="h-4 w-4" aria-hidden="true" />
              ) : (
                <VscChromeMaximize className="h-4 w-4" aria-hidden="true" />
              )}
            </TitleBarButton>
            <TitleBarButton
              label="Close window"
              className="hover:bg-destructive hover:text-destructive-foreground text-foreground inline-flex h-full w-[46px] items-center justify-center transition-colors"
              onClick={handleClose}
            >
              <VscChromeClose className="h-4 w-4" aria-hidden="true" />
            </TitleBarButton>
          </div>
        )}
      </div>
    </div>
  );
}
