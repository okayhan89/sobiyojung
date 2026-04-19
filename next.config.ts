import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const ONE_YEAR = 60 * 60 * 24 * 365;

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  // Do NOT let the SW intercept Supabase Auth / OAuth / Realtime traffic.
  exclude: [/^manifest\.webmanifest$/, /\.map$/],
});

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Router cache: keep dynamic pages warm for 30s, static for 5min.
  // Back/forward + same-session re-visits feel instant; realtime corrects
  // anything stale that leaked through.
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
    // View Transitions API — native-feeling page transitions in Chrome/Safari 18+.
    // Unsupported browsers degrade to no animation (no breakage).
    viewTransition: true,
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
      {
        source: "/sw.js",
        headers: [
          {
            // Service worker file must not be aggressively cached —
            // otherwise updates won't ship to returning users.
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
