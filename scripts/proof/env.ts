import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

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

export function publicEnvSummary() {
  return {
    rpc: process.env.OG_RPC_URL || process.env.VITE_OG_RPC_URL || "https://evmrpc-testnet.0g.ai",
    storageIndexer:
      process.env.OG_STORAGE_INDEXER_URL ||
      process.env.VITE_OG_STORAGE_INDEXER_URL ||
      "https://indexer-storage-testnet-turbo.0g.ai",
    computeEndpoint:
      process.env.OG_COMPUTE_ENDPOINT ||
      process.env.VITE_OG_COMPUTE_ENDPOINT ||
      "https://router-api-testnet.integratenetwork.work/v1",
    daClientGrpc: process.env.OG_DA_CLIENT_GRPC_URL || "",
    hasStorageSigner: Boolean(process.env.OG_PRIVATE_KEY),
    hasComputeKey: Boolean(process.env.OG_COMPUTE_API_KEY || process.env.VITE_OG_COMPUTE_API_KEY),
    hasDaClient: Boolean(process.env.OG_DA_CLIENT_GRPC_URL),
  };
}

export function writeProofArtifact(name: string, value: unknown) {
  const body = `${JSON.stringify(value, null, 2)}\n`;
  mkdirSync("proof-artifacts", { recursive: true });
  mkdirSync("public/proof-artifacts", { recursive: true });
  writeFileSync(`proof-artifacts/${name}`, body);
  writeFileSync(`public/proof-artifacts/${name}`, body);
}
