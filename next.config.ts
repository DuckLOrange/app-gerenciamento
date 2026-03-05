import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Disable App Router image optimization since it requires a Node.js server
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
