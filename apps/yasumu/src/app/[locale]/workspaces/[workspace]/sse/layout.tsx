import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@yasumu/ui/components/resizable';

import LayoutGroup from '@/components/layout/layout-group';

import { MonacoPreloader } from '../_components/monaco-preloader';
import { SseFileTree } from './_components/sse-file-tree';
import { SseFileTreeContextProvider } from './_providers/file-tree-context';
import { SseContextProvider } from './_providers/sse-context';

export default function SseLayout({ children }: React.PropsWithChildren) {
  return (
    <LayoutGroup>
      <MonacoPreloader />
      <SseFileTreeContextProvider>
        <SseContextProvider>
          <ResizablePanelGroup direction="horizontal" className="h-full" autoSaveId="yasumu-sse-explorer-layout">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
              <SseFileTree />
            </ResizablePanel>
            <ResizableHandle withHandle aria-label="Resize SSE explorer" />
            <ResizablePanel defaultSize={80}>{children}</ResizablePanel>
          </ResizablePanelGroup>
        </SseContextProvider>
      </SseFileTreeContextProvider>
    </LayoutGroup>
  );
}
