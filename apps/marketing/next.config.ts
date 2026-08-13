import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ai-visibility-os/ui'],
};

export default nextConfig;
