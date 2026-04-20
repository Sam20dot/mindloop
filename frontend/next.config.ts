import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow images from external sources if needed in future
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
