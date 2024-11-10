'use client';
import React from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import { useLayout } from '@/stores/AppLayout';
import { YasumuLayout } from '@/lib/constants/layout';

export function ResizableApplicationLayout({
  bottom,
  left,
  right,
  id = 'default-layout',
}: {
  id?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  bottom?: React.ReactNode;
}) {
  const appLayout = useLayout();
  const direction = appLayout === YasumuLayout.Classic ? 'vertical' : 'horizontal';

  return (
    <ResizablePanelGroup direction="horizontal" autoSaveId={`${id}:1`}>
      {left && (
        <ResizablePanel defaultSize={17} minSize={10}>
          {left}
        </ResizablePanel>
      )}
      {(right || bottom) && <ResizableHandle />}
      {(right || bottom) && (
        <ResizablePanel>
          <ResizablePanelGroup direction={direction} autoSaveId={`${id}:2`}>
            {right && <ResizablePanel>{right}</ResizablePanel>}
            {bottom && <ResizableHandle />}
            {bottom && <ResizablePanel className="h-[99%] w-0 overflow-auto">{bottom}</ResizablePanel>}
          </ResizablePanelGroup>
        </ResizablePanel>
      )}
    </ResizablePanelGroup>
  );
}
