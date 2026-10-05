const { readFileSync } = require("node:fs");
const path = require("node:path");
const { parseEnv } = require("node:util");

// Requires Node.js 22+; parse without shell expansion of secret characters.
const productionEnv = parseEnv(readFileSync(path.join(__dirname, ".env"), "utf8"));
const frontendDir = path.join(__dirname, "apps/frontend");
const publicEnv = Object.fromEntries(
  Object.entries(productionEnv).filter(([key]) => key.startsWith("NEXT_PUBLIC_"))
);

module.exports = {
  apps: [
    {
      name: "supporthub-backend",
      cwd: path.join(__dirname, "apps/backend"),
      script: "dist/src/main.js",
      interpreter: process.execPath,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      time: true,
      env: { ...productionEnv, NODE_ENV: "production", PORT: productionEnv.PORT || "4000" }
    },
    {
      name: "supporthub-frontend",
      cwd: frontendDir,
      script: require.resolve("next/dist/bin/next", { paths: [frontendDir] }),
      args: "start --hostname 0.0.0.0 --port 3000",
      interpreter: process.execPath,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      time: true,
      env: { ...publicEnv, NODE_ENV: "production", PORT: "3000" }
    }
  ]
};
