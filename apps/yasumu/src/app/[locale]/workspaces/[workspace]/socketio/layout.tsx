import LayoutGroup from '@/components/layout/layout-group';
import { ResizableApplicationLayout } from '@/components/layout/resizable-layout';

import OutputConsole from './_components/output-console';
import { SocketioFileTree } from './_components/socketio-file-tree';

export default function SocketioLayout({ children }: React.PropsWithChildren) {
  return (
    <LayoutGroup>
      <ResizableApplicationLayout
        id="yasumu-socketio-layout"
        left={<SocketioFileTree />}
        right={children}
        bottom={<OutputConsole />}
      />
    </LayoutGroup>
  );
}
