import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@ai-visibility-os/ui',
    '@ai-visibility-os/database',
    '@ai-visibility-os/shared',
  ],
};

export default nextConfig;
