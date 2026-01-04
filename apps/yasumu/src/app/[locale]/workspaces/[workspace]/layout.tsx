import { ActiveWorkspaceGuard } from '@/components/providers/workspace-provider';
import { MonacoPreloader } from './_components/monaco-preloader';
import WorkspaceSelectionPage from '@/app/page';

export async function generateStaticParams() {
  return [{ workspace: 'default' }];
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MonacoPreloader />
      <ActiveWorkspaceGuard fallback={<WorkspaceSelectionPage />}>
        {children}
      </ActiveWorkspaceGuard>
    </>
  );
}
