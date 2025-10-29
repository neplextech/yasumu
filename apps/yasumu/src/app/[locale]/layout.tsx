import { Locale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

export async function generateStaticParams() {
  return [{ locale: 'en' }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  setRequestLocale((await params).locale);

  return <>{children}</>;
}
