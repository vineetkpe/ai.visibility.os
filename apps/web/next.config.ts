import type { NextConfig } from 'next';

if (typeof process !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && (args[0].includes('supabase/discussions/45715') || args[0].includes('Node.js 20 and below are deprecated'))) {
      return;
    }
    originalWarn(...args);
  };
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@ai-visibility-os/ui',
    '@ai-visibility-os/database',
    '@ai-visibility-os/shared',
  ],
};

export default nextConfig;

