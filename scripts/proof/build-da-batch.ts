import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";

loadLocalEnv();
await import("./diagnose-da-stack");

const MAX_DA_BLOB_BYTES = 32_505_852;
const sidecarUrl = process.env.OG_DA_SIDECAR_URL || "http://127.0.0.1:51080";

async function deriveDaClientGrpc() {
  if (process.env.OG_DA_CLIENT_GRPC_URL) return process.env.OG_DA_CLIENT_GRPC_URL;
  try {
    const response = await fetch(`${sidecarUrl.replace(/\/$/, "")}/health`);
    const body = await response.json() as { daClientGrpc?: string };
    if (body.daClientGrpc) process.env.OG_DA_CLIENT_GRPC_URL = body.daClientGrpc;
  } catch {
    // Leave the proof honestly blocked when no configured sidecar is reachable.
  }
  return process.env.OG_DA_CLIENT_GRPC_URL || "";
}

function readJson(path: string) {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown> : null;
}

const latestProof = readJson("proof-artifacts/latest-proof-packet.json");
const dataPipeline = readJson("proof-artifacts/data-pipeline-latest.json");
const storage = readJson("proof-artifacts/storage-latest.json");
const storageBundle = readJson("proof-artifacts/storage-bundle-latest.json");
const storageReadback = readJson("proof-artifacts/storage-readback-latest.json");
const chain = readJson("proof-artifacts/chain-result-latest.json");
const chainReadback = readJson("proof-artifacts/chain-readback-latest.json");
const chainEvents = readJson("proof-artifacts/chain-events-latest.json");
const escrowReadiness = readJson("proof-artifacts/escrow-readiness-latest.json");
const browserWallet = readJson("proof-artifacts/browser-wallet-latest.json");
const wagerSettlement = readJson("proof-artifacts/wager-settlement-latest.json");
const compute = readJson("proof-artifacts/compute-latest.json");
const computeBroker = readJson("proof-artifacts/compute-broker-latest.json");
const computeRuntime = readJson("proof-artifacts/compute-runtime-latest.json");
const infraDiagnostics = readJson("proof-artifacts/infra-diagnostics-latest.json");
const runtimeFinalize = readJson("proof-artifacts/runtime-finalize-latest.json");
const integrationMatrix = readJson("proof-artifacts/integration-matrix-latest.json");
const cloudflareTunnel = readJson("proof-artifacts/cloudflare-tunnel-latest.json");
const daStack = readJson("proof-artifacts/da-stack-readiness-latest.json");
const agenticId = readJson("proof-artifacts/agentic-id-latest.json");
const agenticRegistry = readJson("proof-artifacts/agentic-registry-latest.json");
const agenticReadback = readJson("proof-artifacts/agentic-id-readback-latest.json");
const agentManagerReadback = readJson("proof-artifacts/agent-manager-readback-latest.json");

const batch = {
  schema: "0g-world-cup-da-batch-v1",
  purpose: "World Cup match/tournament event availability batch",
  generatedAt: new Date(0).toISOString(),
  entries: [
    { kind: "proof-packet", value: latestProof?.proofPacket ?? latestProof },
    { kind: "data-pipeline", value: dataPipeline },
    { kind: "storage-receipt", value: storage },
    { kind: "storage-bundle", value: storageBundle },
    { kind: "storage-readback", value: storageReadback },
    { kind: "chain-result", value: chain },
    { kind: "chain-readback", value: chainReadback },
    { kind: "chain-events", value: chainEvents },
    { kind: "escrow-readiness", value: escrowReadiness },
    { kind: "browser-wallet-e2e", value: browserWallet },
    { kind: "wager-settlement", value: wagerSettlement },
    { kind: "compute-status", value: compute },
    { kind: "compute-broker", value: computeBroker },
    { kind: "compute-runtime", value: computeRuntime },
    { kind: "infra-diagnostics", value: infraDiagnostics },
    { kind: "runtime-finalize", value: runtimeFinalize },
    { kind: "integration-matrix", value: integrationMatrix },
    { kind: "cloudflare-tunnel", value: cloudflareTunnel },
    { kind: "da-stack-readiness", value: daStack },
    { kind: "agentic-id", value: agenticId },
    { kind: "agentic-registry", value: agenticRegistry },
    { kind: "agentic-id-readback", value: agenticReadback },
    { kind: "agent-manager-readback", value: agentManagerReadback },
  ],
};

const bytes = new TextEncoder().encode(JSON.stringify(batch));
const blobHash = `0x${createHash("sha256").update(bytes).digest("hex")}`;
const daClientGrpc = await deriveDaClientGrpc();
const artifact = {
  status: daClientGrpc ? "ready" : "blocked",
  blobReady: bytes.byteLength <= MAX_DA_BLOB_BYTES,
  blobBytes: bytes.byteLength,
  maxBlobBytes: MAX_DA_BLOB_BYTES,
  blobHash,
  daClientGrpc,
  reason: daClientGrpc
    ? "DA client endpoint configured; submit through the running 0G DA Client."
    : "Missing OG_DA_CLIENT_GRPC_URL. 0G DA live submission requires a DA Client plus Encoder/Retriever.",
  env: publicEnvSummary(),
};

writeProofArtifact("da-latest.json", artifact);
writeProofArtifact("da-batch-payload-latest.json", batch);
console.log(JSON.stringify(artifact, null, 2));
