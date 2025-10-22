import type { NextConfig } from 'next';
import { createTransletta } from 'transletta/next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    useCache: true,
    typedEnv: true,
    viewTransition: true,
  },
  typedRoutes: true,
  transpilePackages: ['@yasumu/ui'],
};

const withNextIntl = createNextIntlPlugin();
const withTransletta = createTransletta({
  compileOnBuild: true,
  watchInDevelopment: true,
  config: {
    input: '.transletta',
    output: '.transletta/generated',
    plugins: [],
    primaryLocale: 'en',
    projects: null,
    warnOnEmptyTranslations: false,
    dts: 'next-intl',
    dtsOutput: './global.d.ts',
  },
});

export default withTransletta(withNextIntl(nextConfig));
