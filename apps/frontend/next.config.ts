import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@support-hub/ui", "@support-hub/shared-types"],
  allowedDevOrigins: ["192.168.29.26"],
  poweredByHeader: false
};

export default nextConfig;
