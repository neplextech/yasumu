import type { NextConfig } from 'next';
import { createTransletta } from 'transletta/next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    useCache: true,
    typedEnv: true,
    viewTransition: true,
    turbopackFileSystemCacheForDev: true,
  },
  typedRoutes: true,
  transpilePackages: ['@yasumu/ui'],
  poweredByHeader: false,
};

const withNextIntl = createNextIntlPlugin({
  requestConfig: './src/i18n/request.ts',
});
const withTransletta = createTransletta({
  config: {
    compactOutput: true,
    dts: 'next-intl',
    dtsOutput: './global.ts',
    input: '.transletta',
    output: '.transletta/generated',
    primaryLocale: 'en',
    plugins: [],
    projects: null,
    warnOnEmptyTranslations: true,
  },
});

export default withTransletta(withNextIntl(nextConfig));
