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

type ComputeEnv = {
  apiKey: string;
  endpoint: string;
  model: string;
  source: string;
};

const fallbackComputeEndpoint = "https://router-api-testnet.integratenetwork.work/v1";
const fallbackSarvamEndpoint = "https://api.sarvam.ai/v1";
const fallbackSarvamModel = "sarvam-30b";

function uniqueComputeEnvs(candidates: ComputeEnv[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (!candidate.apiKey) return false;
    const fingerprint = `${candidate.source}:${candidate.apiKey}:${candidate.endpoint}:${candidate.model}`;
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });
}

export function getComputeEnvCandidates(): ComputeEnv[] {
  return uniqueComputeEnvs([
    {
      source: "ZEROG_ROUTER_API_KEY",
      apiKey: process.env.ZEROG_ROUTER_API_KEY || "",
      endpoint: process.env.ZEROG_COMPUTE_ROUTER || fallbackComputeEndpoint,
      model: process.env.ZEROG_COMPUTE_MODEL || process.env.OG_COMPUTE_MODEL || "",
    },
    {
      source: "OG_COMPUTE_API_KEY",
      apiKey: process.env.OG_COMPUTE_API_KEY || "",
      endpoint: process.env.OG_COMPUTE_ENDPOINT || process.env.VITE_OG_COMPUTE_ENDPOINT || fallbackComputeEndpoint,
      model: process.env.OG_COMPUTE_MODEL || process.env.VITE_OG_COMPUTE_MODEL || "",
    },
    {
      source: "VITE_OG_COMPUTE_API_KEY",
      apiKey: process.env.VITE_OG_COMPUTE_API_KEY || "",
      endpoint: process.env.VITE_OG_COMPUTE_ENDPOINT || process.env.OG_COMPUTE_ENDPOINT || fallbackComputeEndpoint,
      model: process.env.VITE_OG_COMPUTE_MODEL || process.env.OG_COMPUTE_MODEL || "",
    },
  ]);
}

export function getComputeEnv() {
  const [candidate] = getComputeEnvCandidates();
  if (candidate) return candidate;
  return {
    source: "missing",
    apiKey: "",
    endpoint:
      process.env.OG_COMPUTE_ENDPOINT ||
      process.env.VITE_OG_COMPUTE_ENDPOINT ||
      process.env.ZEROG_COMPUTE_ROUTER ||
      fallbackComputeEndpoint,
    model: process.env.OG_COMPUTE_MODEL || process.env.VITE_OG_COMPUTE_MODEL || process.env.ZEROG_COMPUTE_MODEL || "",
  };
}

export function getSarvamFallbackEnv() {
  return {
    source: "SARVAM_API_KEY",
    apiKey: process.env.SARVAM_API_KEY || "",
    endpoint: (process.env.SARVAM_ENDPOINT || fallbackSarvamEndpoint).replace(/\/$/, ""),
    model: process.env.SARVAM_MODEL || fallbackSarvamModel,
  };
}
