/** @type {import('next').NextConfig} */
const rawBackend = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";
const destinationUrl = rawBackend.endsWith("/api") ? `${rawBackend}/:path*` : `${rawBackend}/api/:path*`;

const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: destinationUrl,
      },
    ];
  },
};

export default nextConfig;
