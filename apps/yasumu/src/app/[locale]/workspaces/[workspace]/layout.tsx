import WorkspaceSelectionPage from '@/app/page';
import { ActiveWorkspaceGuard } from '@/components/providers/workspace-provider';

export async function generateStaticParams() {
  return [{ workspace: 'default' }];
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ActiveWorkspaceGuard fallback={<WorkspaceSelectionPage />}>{children}</ActiveWorkspaceGuard>
    </>
  );
}
