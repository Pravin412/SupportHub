import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const backendDir = fileURLToPath(new URL("../", import.meta.url));
const backendEnv = fileURLToPath(new URL("../.env", import.meta.url));
const rootEnv = fileURLToPath(new URL("../../../.env", import.meta.url));
const envPath = existsSync(backendEnv) ? backendEnv : rootEnv;
if (existsSync(envPath)) loadEnvFile(envPath);

const require = createRequire(import.meta.url);
const packagePath = require.resolve("prisma/package.json");
const prismaPackage = JSON.parse(readFileSync(packagePath, "utf8"));
const cliPath = path.resolve(path.dirname(packagePath), prismaPackage.bin.prisma);
const result = spawnSync(process.execPath, [cliPath, ...process.argv.slice(2)], {
  cwd: backendDir,
  env: process.env,
  stdio: "inherit"
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
