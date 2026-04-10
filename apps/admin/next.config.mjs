/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/admin',
  assetPrefix: '/admin',
  experimental: {
    typedRoutes: true,
  },
  transpilePackages: ['@printos/ui'],
};

export default nextConfig;
