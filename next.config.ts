import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force Webpack (disable Turbopack for build)
  experimental: {
    turbopack: false,
  },
};

export default nextConfig;