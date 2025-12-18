import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopack: false, // Turn off Turbopack — fixes the prerender error
  },
};

export default nextConfig;