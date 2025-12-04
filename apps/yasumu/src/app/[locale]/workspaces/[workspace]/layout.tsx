export async function generateStaticParams() {
  // thanks to nextjs for not allowing dynamic routes in SPA
  return [{ workspace: 'default' }];
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
