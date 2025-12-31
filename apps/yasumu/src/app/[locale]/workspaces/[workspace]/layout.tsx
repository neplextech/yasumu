import { MonacoPreloader } from './_components/monaco-preloader';

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
      {children}
    </>
  );
}
