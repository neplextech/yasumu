import type { NextConfig } from 'next';
// import { networkInterfaces } from 'node:os';

// const isProd = process.env.NODE_ENV === 'production';
// const isMobile = !!process.env.TAURI_ENV_PLATFORM && /android|ios/.test(process.env.TAURI_ENV_PLATFORM);

// let internalHost: string | undefined;

// function getInternalHost() {
//   if (isProd || !isMobile) return;
//   if (internalHost) return internalHost;

//   const interfaces = networkInterfaces();
//   const address = Object.values(interfaces).flatMap((netInterface) => {
//     return netInterface?.filter((i) => i.family === 'IPv4' && !i.internal);
//   })[0]?.address;

//   internalHost = address;
// }

// function getAssetPrefix() {
//   if (isProd || !isMobile) return;

//   return `http://${getInternalHost()}:3000`;
// }

const nextConfig: NextConfig = {
  // output: 'export',
  // images: { unoptimized: true },
  // assetPrefix: getAssetPrefix(),
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: { reactCompiler: true },
};

export default nextConfig;
