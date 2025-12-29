import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@yasumu/ui/components/resizable';
import LayoutGroup from '@/components/layout/layout-group';
import { RestFileTree } from './_components/rest-file-tree';
import { RestContextProvider } from './_providers/rest-context';

export default function RestLayout({ children }: React.PropsWithChildren) {
  return (
    <LayoutGroup>
      <RestContextProvider>
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
            <RestFileTree />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={80}>{children}</ResizablePanel>
        </ResizablePanelGroup>
      </RestContextProvider>
    </LayoutGroup>
  );
}
