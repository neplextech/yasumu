import { DocsLayout } from 'fumadocs-ui/layouts/docs';

import { baseOptions } from '@/lib/layout.shared';
import { blogsSource, source } from '@/lib/source';

export default function Layout({ children }: LayoutProps<'/blogs'>) {
  return (
    <DocsLayout tree={blogsSource.pageTree} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
