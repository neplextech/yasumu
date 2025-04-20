import LayoutGroup from '@/components/LayoutGroup';
import { ResizableApplicationLayout } from '@/components/ResizableApplicationLayout';
import { MailSidebar } from '@/components/sidebars/MailSidebar';

export default function EmailLayout({ children }: React.PropsWithChildren) {
  return (
    <LayoutGroup>
      <ResizableApplicationLayout
        id="yasumu-email-layout"
        left={
          <MailSidebar className="hidden flex-1 md:flex max-h-screen w-full" />
        }
        right={children}
      />
    </LayoutGroup>
  );
}
