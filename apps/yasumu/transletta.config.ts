import { defineConfig } from 'transletta/config';

export default defineConfig({
  compactOutput: true,
  dts: 'next-intl',
  dtsOutput: './i18n.d.ts',
  input: '.transletta',
  output: '.transletta/generated',
  primaryLocale: 'en',
  plugins: [],
  projects: null,
  warnOnEmptyTranslations: true,
});
