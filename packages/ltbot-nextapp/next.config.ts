import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true
  },
  // 启用独立输出模式（Docker 部署必需）
  // output: 'standalone',
};

export default nextConfig;
