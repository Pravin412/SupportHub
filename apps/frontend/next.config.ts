import type { NextConfig } from "next";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

const frontendEnvPath = path.join(__dirname, ".env");
const rootEnvPath = path.resolve(__dirname, "../../.env");

if (!existsSync(frontendEnvPath) && existsSync(rootEnvPath)) {
  const rootEnv = parseEnv(readFileSync(rootEnvPath, "utf8"));
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
