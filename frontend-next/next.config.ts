import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@/components"],
  bundlePagesRouterDependencies: true, 
  
  experimental: {
    // Các tính năng thực nghiệm khác nếu cần
  },
};

// Sử dụng đường dẫn tuyệt đối để Turbopack xác định đúng root
// @ts-ignore
nextConfig['turbopack'] = {
  root: 'C:\\GitHub\\financial-management\\frontend-next',
};

export default nextConfig;