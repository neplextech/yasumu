import { Locale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const jar = await cookies();
  const locale = (jar.get('locale')?.value ?? 'en') as Locale;
  const messages = (
    await import(`../../.transletta/generated/${locale}.json`).catch((e) => {
      console.error(e);
      return { default: {} };
    })
  ).default;

  console.log({ messages });

  return {
    locale,
    messages,
  };
});
