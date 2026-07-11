import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { blogsSource, getBlogImage } from '@/lib/source';
import { getMDXComponents } from '@/mdx-components';

export default async function Page(props: PageProps<'/blogs/[[...slug]]'>) {
  const params = await props.params;
  const page = blogsSource.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(blogsSource, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return blogsSource.generateParams();
}

export async function generateMetadata(props: PageProps<'/blogs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = blogsSource.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getBlogImage(page).url,
    },
  };
}
