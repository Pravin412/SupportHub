import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@support-hub/ui", "@support-hub/shared-types"],
  poweredByHeader: false
};

export default nextConfig;
