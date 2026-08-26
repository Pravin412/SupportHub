import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@central-support/ui", "@central-support/shared-types"],
  poweredByHeader: false
};

export default nextConfig;
