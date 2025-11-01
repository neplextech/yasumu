import LayoutGroup from '@/components/layout/layout-group';
import { ResizableApplicationLayout } from '@/components/layout/resizable-layout';
import { SseFileTree } from './(components)/sse-file-tree';
import OutputConsole from './(components)/output-console';

export default function SseLayout({ children }: React.PropsWithChildren) {
  return (
    <LayoutGroup>
      <ResizableApplicationLayout
        id="yasumu-sse-layout"
        left={<SseFileTree />}
        right={children}
        bottom={<OutputConsole />}
      />
    </LayoutGroup>
  );
}
