import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@yasumu/ui/components/resizable';

import LayoutGroup from '@/components/layout/layout-group';

import { MonacoPreloader } from '../_components/monaco-preloader';
import { GraphqlFileTree } from './_components/graphql-file-tree';
import { GraphqlFileTreeContextProvider } from './_providers/file-tree-context';
import { GraphqlContextProvider } from './_providers/graphql-context';

export default function GraphqlLayout({ children }: React.PropsWithChildren) {
  return (
    <LayoutGroup>
      <MonacoPreloader />
      <GraphqlFileTreeContextProvider>
        <GraphqlContextProvider>
          <ResizablePanelGroup direction="horizontal" className="h-full" autoSaveId="yasumu-graphql-explorer-layout">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
              <GraphqlFileTree />
            </ResizablePanel>
            <ResizableHandle withHandle aria-label="Resize GraphQL explorer" />
            <ResizablePanel defaultSize={80}>{children}</ResizablePanel>
          </ResizablePanelGroup>
        </GraphqlContextProvider>
      </GraphqlFileTreeContextProvider>
    </LayoutGroup>
  );
}
