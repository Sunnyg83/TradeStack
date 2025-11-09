import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // External packages for server components (Next.js 16+)
  serverExternalPackages: ['plaid'],
  
  // Use Turbopack (default in Next.js 16)
  // If you need webpack instead, run: npm run dev -- --webpack
};

export default nextConfig;
