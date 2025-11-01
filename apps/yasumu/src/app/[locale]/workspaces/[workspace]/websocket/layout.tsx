import LayoutGroup from '@/components/layout/layout-group';
import { ResizableApplicationLayout } from '@/components/layout/resizable-layout';
import { WebsocketFileTree } from './(components)/websocket-file-tree';
import OutputConsole from './(components)/output-console';

export default function WebsocketLayout({ children }: React.PropsWithChildren) {
  return (
    <LayoutGroup>
      <ResizableApplicationLayout
        id="yasumu-websocket-layout"
        left={<WebsocketFileTree />}
        right={children}
        bottom={<OutputConsole />}
      />
    </LayoutGroup>
  );
}
