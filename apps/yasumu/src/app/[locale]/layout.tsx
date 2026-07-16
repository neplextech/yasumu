import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AvailableLocales, Locales } from 'transletta/client';

export async function generateStaticParams() {
  return AvailableLocales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!AvailableLocales.includes(locale as Locales)) notFound();
  setRequestLocale(locale as Locales);

  return <>{children}</>;
}
