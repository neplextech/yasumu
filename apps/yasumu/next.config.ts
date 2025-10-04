import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: { useCache: true, typedEnv: true, viewTransition: true },
  eslint: { ignoreDuringBuilds: true },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
