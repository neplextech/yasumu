import { setRequestLocale } from 'next-intl/server';
import { AvailableLocales, Locales } from 'transletta/client';

export async function generateStaticParams() {
  return AvailableLocales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locales }>;
}) {
  setRequestLocale((await params).locale);

  return <>{children}</>;
}
