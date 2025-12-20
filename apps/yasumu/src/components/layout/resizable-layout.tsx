'use client';
import React from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@yasumu/ui/components/resizable';
import { YasumuLayout } from '@/lib/constants/layout';
import { useAppLayout } from '../providers/app-layout-provider';

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
  const { layout } = useAppLayout();
  const direction = layout === YasumuLayout.Classic ? 'vertical' : 'horizontal';

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
            {bottom && <ResizablePanel>{bottom}</ResizablePanel>}
          </ResizablePanelGroup>
        </ResizablePanel>
      )}
    </ResizablePanelGroup>
  );
}
