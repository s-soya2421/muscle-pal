import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '3mb', // Allow 3MB for image uploads
    },
  },
};

export default nextConfig;
