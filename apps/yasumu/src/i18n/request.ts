import { Locale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const jar = await cookies();
  const locale = (jar.get('locale')?.value ?? 'en') as Locale;

  return {
    locale,
    messages: (await import(`../../translations/${locale}.json`)).default,
  };
});
