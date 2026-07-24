import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permet un build/preview isolé (ex. SEBAVIO_DIST_DIR=.next-visual) sans toucher au .next servi par PM2.
  distDir: process.env.SEBAVIO_DIST_DIR || ".next",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "geolocation=(self)",
          },
        ],
      },
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
