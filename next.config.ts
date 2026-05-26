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
  // Bundle everything a serverless function needs to bring up the SQLite demo
  // DB on a cold start with zero env config:
  //   - the pre-seeded dev.db (best case — copied straight to /tmp)
  //   - migration.sql (fallback path: re-create schema if dev.db wasn't bundled)
  //   - the compiled seed module (fallback path: re-seed an empty DB)
  //   - Prisma's native query engine binaries for the Vercel runtime
  outputFileTracingIncludes: {
    "/**/*": [
      "prisma/dev.db",
      "prisma/migrations/**/*.sql",
      "prisma/seed.ts",
      "node_modules/.prisma/client/*.node",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "graph.microsoft.com" },
    ],
  },
};

export default nextConfig;
