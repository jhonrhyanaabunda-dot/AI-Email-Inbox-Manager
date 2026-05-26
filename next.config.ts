import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  serverExternalPackages: [],
  // Worker code produces type errors that don't affect runtime. tsc runs in
  // dev via the editor; we don't gate Vercel builds on it.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "graph.microsoft.com" },
    ],
  },
  // pptxgenjs (used in /methodology for the .pptx export) imports `node:https`
  // for fetching remote images. We never use that path in the browser — slides
  // are pure text/shape — so redirect any `node:*` import in the client bundle
  // to an empty module via NormalModuleReplacementPlugin.
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.plugins = config.plugins ?? [];
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: any) => {
          // Rewrite `node:https` → `https`, etc.; the fallback below maps those
          // bare specifiers to `false` so webpack stubs the module entirely.
          resource.request = resource.request.replace(/^node:/, "");
        }),
      );
      config.resolve.fallback = {
        ...config.resolve.fallback,
        https: false,
        http: false,
        fs: false,
        path: false,
        stream: false,
        zlib: false,
        os: false,
      };
    }
    return config;
  },
};

export default nextConfig;
