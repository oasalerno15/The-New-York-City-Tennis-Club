import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Allow localhost and forwarded IDE preview domains in dev. */
  allowedDevOrigins: [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "*.preview.app.github.dev",
    "*.preview.app",
    "*.cursor.sh",
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'me7aitdbxq.ufs.sh',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
