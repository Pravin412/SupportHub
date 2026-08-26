import { rm } from "node:fs/promises";

for (let attempt = 1; attempt <= 5; attempt += 1) {
  try {
    await rm("dist", { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    process.exit(0);
  } catch (error) {
    if (attempt === 5) throw error;
    await new Promise((resolve) => setTimeout(resolve, attempt * 100));
  }
}
