import LayoutGroup from '@/components/layout/layout-group';
import { ResizableApplicationLayout } from '@/components/layout/resizable-layout';
import { GrpcFileTree } from './(components)/grpc-file-tree';
import OutputConsole from './(components)/output-console';

export default function GrpcLayout({ children }: React.PropsWithChildren) {
  return (
    <LayoutGroup>
      <ResizableApplicationLayout
        id="yasumu-grpc-layout"
        left={<GrpcFileTree />}
        right={children}
        bottom={<OutputConsole />}
      />
    </LayoutGroup>
  );
}
