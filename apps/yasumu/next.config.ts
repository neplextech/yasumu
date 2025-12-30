import type { NextConfig } from 'next';
import { createTransletta } from 'transletta/next';
import createNextIntlPlugin from 'next-intl/plugin';

const isProd = process.env.NODE_ENV === 'production';
const internalHost = process.env.TAURI_DEV_HOST || 'localhost';

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    useCache: true,
    typedEnv: true,
    viewTransition: true,
    turbopackFileSystemCacheForDev: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  devIndicators: false,
  typedRoutes: true,
  transpilePackages: ['@yasumu/ui'],
  poweredByHeader: false,
  output: 'export',
  images: {
    unoptimized: true,
  },
  assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
};

const withNextIntl = createNextIntlPlugin({
  requestConfig: './src/i18n/request.ts',
});

const withTransletta = createTransletta();

export default withTransletta(withNextIntl(nextConfig));
