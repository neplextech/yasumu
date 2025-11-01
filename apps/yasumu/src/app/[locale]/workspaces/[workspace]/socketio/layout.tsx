import LayoutGroup from '@/components/layout/layout-group';
import { ResizableApplicationLayout } from '@/components/layout/resizable-layout';
import { SocketioFileTree } from './(components)/socketio-file-tree';
import OutputConsole from './(components)/output-console';

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
