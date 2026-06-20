import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Enables the `use cache` directive (Next.js 16 caching model)
    useCache: true,
  },
  async rewrites() {
    const backendUrl =
      process.env.PYTHON_SERVICE_URL ||
      "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
