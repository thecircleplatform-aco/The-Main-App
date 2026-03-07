/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Allow build to complete on Vercel if lint has non-blocking issues
  eslint: { ignoreDuringBuilds: true },

  // Server Actions (enabled by default in App Router; explicit for production)
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },

  // Security and caching headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },

};

export default nextConfig;
