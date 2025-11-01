import LayoutGroup from '@/components/layout/layout-group';
import { ResizableApplicationLayout } from '@/components/layout/resizable-layout';

export default function EnvironmentLayout({
  children,
}: React.PropsWithChildren) {
  return (
    <LayoutGroup>
      <ResizableApplicationLayout
        id="yasumu-environment-layout"
        right={children}
      />
    </LayoutGroup>
  );
}
