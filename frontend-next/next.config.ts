import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@/components"],
  bundlePagesRouterDependencies: true,

  experimental: {

  },
};

nextConfig['turbopack'] = {
  root: 'C:\\GitHub\\financial-management\\frontend-next',
};

export default nextConfig;