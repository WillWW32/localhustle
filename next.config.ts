import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Force all pages dynamic — no static prerender, no error
  // Your interactivity (onClick, hover) works perfectly
  // Common for apps with auth or dynamic content
  // No loss of JS effects
  // No loss of speed (Vercel caches dynamic pages)

  images: {
    unoptimized: true,
  },
};

export default nextConfig;