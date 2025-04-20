import LayoutGroup from '@/components/LayoutGroup';
import { ResizableApplicationLayout } from '@/components/ResizableApplicationLayout';
import { EnvironmentSidebar } from '@/components/sidebars/EnvironmentSidebar';

export default function EnvironmentLayout({
  children,
}: React.PropsWithChildren) {
  return (
    <LayoutGroup>
      <ResizableApplicationLayout
        id="yasumu-environment-layout"
        left={
          <EnvironmentSidebar className="hidden flex-1 md:flex max-h-screen w-full" />
        }
        right={children}
      />
    </LayoutGroup>
  );
}
