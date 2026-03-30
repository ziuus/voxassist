import type { NextConfig } from "next";
import path from "node:path";

const appRoot = __dirname;

const nextConfig: NextConfig = {
  outputFileTracingRoot: appRoot,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    root: appRoot,
    resolveAlias: {
      tailwindcss: path.join(appRoot, "node_modules/tailwindcss"),
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    const modules = config.resolve.modules || [];
    config.resolve.modules = [path.join(appRoot, "node_modules"), ...modules];
    return config;
  },
};

export default nextConfig;
