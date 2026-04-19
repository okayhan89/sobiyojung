import type { NextConfig } from "next";

const ONE_YEAR = 60 * 60 * 24 * 365;

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Router cache: keep dynamic pages warm for 30s, static for 5min.
  // Makes back/forward + same-session re-visits feel instant; realtime
  // subscription corrects anything stale that leaked through.
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },

  async headers() {
    return [
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: `public, max-age=${ONE_YEAR}, immutable`,
          },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
        ],
      },
      {
        source: "/opengraph-image",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
