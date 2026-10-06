import type { NextConfig } from "next";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

const frontendEnvPath = path.join(__dirname, ".env");
const rootEnvPath = path.resolve(__dirname, "../../.env");

if (!existsSync(frontendEnvPath) && existsSync(rootEnvPath)) {
  const rootEnv = parseEnv(readFileSync(rootEnvPath, "utf8"));
  // Resolve the API alias without expanding unrelated values such as secrets.
  if (rootEnv.NEXT_PUBLIC_API_URL?.includes("${IP_ADDRESS}")) {
    const apiAddress = process.env.IP_ADDRESS ?? rootEnv.IP_ADDRESS;
    if (!apiAddress) throw new Error("IP_ADDRESS is required by NEXT_PUBLIC_API_URL");
    rootEnv.NEXT_PUBLIC_API_URL = rootEnv.NEXT_PUBLIC_API_URL.replaceAll("${IP_ADDRESS}", apiAddress);
  }
  for (const [key, value] of Object.entries(rootEnv)) {
    if (key.startsWith("NEXT_PUBLIC_") && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const nextConfig: NextConfig = {
  transpilePackages: ["@support-hub/ui", "@support-hub/shared-types"],
  allowedDevOrigins: ["192.168.29.26"],
  poweredByHeader: false
};

export default nextConfig;
