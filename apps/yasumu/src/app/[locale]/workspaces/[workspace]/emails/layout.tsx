import LayoutGroup from '@/components/layout/layout-group';
import { ResizableApplicationLayout } from '@/components/layout/resizable-layout';

export default function MailboxLayout({ children }: React.PropsWithChildren) {
  return (
    <LayoutGroup>
      <ResizableApplicationLayout id="yasumu-mailbox-layout" right={children} />
    </LayoutGroup>
  );
}
