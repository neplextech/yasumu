import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@yasumu/ui/components/resizable';
import LayoutGroup from '@/components/layout/layout-group';
import { GraphqlFileTree } from './_components/graphql-file-tree';
import { GraphqlContextProvider } from './_providers/graphql-context';
import { GraphqlFileTreeContextProvider } from './_providers/file-tree-context';

export default function GraphqlLayout({ children }: React.PropsWithChildren) {
  return (
    <LayoutGroup>
      <GraphqlFileTreeContextProvider>
        <GraphqlContextProvider>
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
              <GraphqlFileTree />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={80}>{children}</ResizablePanel>
          </ResizablePanelGroup>
        </GraphqlContextProvider>
      </GraphqlFileTreeContextProvider>
    </LayoutGroup>
  );
}
