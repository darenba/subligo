/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/admin',
  assetPrefix: '/admin',
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@printos/ui'],
};

export default nextConfig;
