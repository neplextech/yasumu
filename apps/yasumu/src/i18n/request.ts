import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    locale = 'en';
  }

  const messages = (
    await import(`../../.transletta/generated/${locale}.json`).catch((e) => {
      console.error(e);
      return { default: {} };
    })
  ).default;

  return {
    locale,
    messages,
  };
});
