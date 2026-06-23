import { existsSync, readFileSync } from "node:fs";

export function loadLocalEnv(path = ".env.local") {
  if (!existsSync(path)) return;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    process.env[key] ||= value;
  }
}

export function getComputeEnv() {
  return {
    apiKey: process.env.OG_COMPUTE_API_KEY || process.env.VITE_OG_COMPUTE_API_KEY || "",
    endpoint:
      process.env.OG_COMPUTE_ENDPOINT ||
      process.env.VITE_OG_COMPUTE_ENDPOINT ||
      "https://router-api-testnet.integratenetwork.work/v1",
    model: process.env.OG_COMPUTE_MODEL || process.env.VITE_OG_COMPUTE_MODEL || "",
  };
}
