import { resolve } from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@printos/ui'],
  webpack(config) {
    config.resolve.alias['@printos/shared'] = resolve(
      process.cwd(),
      '../../packages/shared/dist/index.js',
    );

    return config;
  },
  async rewrites() {
    const adminUpstream = process.env.ADMIN_UPSTREAM_URL;

    if (!adminUpstream) {
      return [];
    }

    return [
      {
        source: '/admin',
        destination: `${adminUpstream}/admin`,
      },
      {
        source: '/admin/:path*',
        destination: `${adminUpstream}/admin/:path*`,
      },
    ];
  },
};

export default nextConfig;
