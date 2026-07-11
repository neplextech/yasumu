import LayoutGroup from '@/components/layout/layout-group';
import { ResizableApplicationLayout } from '@/components/layout/resizable-layout';

import OutputConsole from './_components/output-console';
import { WebsocketFileTree } from './_components/websocket-file-tree';

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
