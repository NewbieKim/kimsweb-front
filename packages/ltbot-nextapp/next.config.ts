import type { NextConfig } from "next";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(packageRoot, "../..");
// Local: under pnpm-workspace. Docker: WORKDIR=/app with no parent workspace.
const isMonorepo = existsSync(path.join(monorepoRoot, "pnpm-workspace.yaml"));

// Next.js 16 requires outputFileTracingRoot === turbopack.root.
// Monorepo local: widen to repo root so Turbopack can follow pnpm's next junction.
// Isolated Docker: stay at package root so .next/standalone/server.js stays flat.
const tracingRoot = isMonorepo ? monorepoRoot : packageRoot;

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Docker runner copies the standalone server produced by this build.
  output: "standalone",
  outputFileTracingRoot: tracingRoot,
  turbopack: {
    root: tracingRoot,
  },

  // 配置允许的图片域名
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
