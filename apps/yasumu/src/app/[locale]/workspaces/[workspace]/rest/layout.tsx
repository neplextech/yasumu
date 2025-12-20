import LayoutGroup from '@/components/layout/layout-group';
import { ResizableApplicationLayout } from '@/components/layout/resizable-layout';
import { RestFileTree } from './_components/rest-file-tree';
import OutputConsole from './_components/output-console';
import { RestContextProvider } from './_providers/rest-context';
import { RestOutputProvider } from './_providers/rest-output';

export default function RestLayout({ children }: React.PropsWithChildren) {
  return (
    <LayoutGroup>
      <RestContextProvider>
        <RestOutputProvider>
          <ResizableApplicationLayout
            id="yasumu-rest-layout"
            left={<RestFileTree />}
            right={children}
            bottom={<OutputConsole />}
          />
        </RestOutputProvider>
      </RestContextProvider>
    </LayoutGroup>
  );
}
