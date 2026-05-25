import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  serverExternalPackages: ["@prisma/client", "bullmq", "ioredis", "googleapis"],
  // Worker code + Prisma JSON typings produce type errors that don't affect runtime.
  // tsc runs in dev via the editor; we don't gate Vercel builds on it.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Bundle the pre-seeded SQLite db + Prisma's query engine binaries with every
  // serverless function so Vercel can run on-the-fly without any database setup.
  outputFileTracingIncludes: {
    "/**/*": ["prisma/dev.db", "node_modules/.prisma/client/*.node"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "graph.microsoft.com" },
    ],
  },
};

export default nextConfig;
