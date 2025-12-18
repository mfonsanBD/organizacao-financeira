import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Empty turbopack config to acknowledge we're using default Turbopack
  turbopack: {},
};

// PWA will be configured separately in production
// For now, keeping it simple for development
export default nextConfig;
