import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@yasumu/ui/components/resizable';

import LayoutGroup from '@/components/layout/layout-group';

import { MonacoPreloader } from '../_components/monaco-preloader';
import { RestFileTree } from './_components/rest-file-tree';
import { FileTreeContextProvider } from './_providers/file-tree-context';
import { RestContextProvider } from './_providers/rest-context';

export default function RestLayout({ children }: React.PropsWithChildren) {
  return (
    <LayoutGroup>
      <MonacoPreloader />
      <FileTreeContextProvider>
        <RestContextProvider>
          <ResizablePanelGroup direction="horizontal" className="h-full" autoSaveId="yasumu-rest-explorer-layout">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
              <RestFileTree />
            </ResizablePanel>
            <ResizableHandle withHandle aria-label="Resize REST explorer" />
            <ResizablePanel defaultSize={80}>{children}</ResizablePanel>
          </ResizablePanelGroup>
        </RestContextProvider>
      </FileTreeContextProvider>
    </LayoutGroup>
  );
}
