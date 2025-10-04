import type { NextConfig } from 'next';

export default {
  reactCompiler: true,
  experimental: { useCache: true, typedEnv: true, viewTransition: true },
  eslint: { ignoreDuringBuilds: true },
} satisfies NextConfig;
