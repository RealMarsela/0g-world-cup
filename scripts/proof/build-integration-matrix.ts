import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { loadLocalEnv, publicEnvSummary, writeProofArtifact } from "./env";

loadLocalEnv();

type Artifact = Record<string, unknown> & {
  status?: string;
  reason?: string;
  checks?: Record<string, boolean>;
};

type Coverage = {
  id: string;
  label: string;
  layer: "data" | "storage" | "chain" | "compute" | "da" | "agentic" | "wallet" | "ui";
  status: "verified" | "ready" | "external-blocked" | "local-only" | "missing";
  artifacts: string[];
  uiSurface: string;
  proof: string;
};

function readArtifact(name: string): Artifact | null {
  const path = `proof-artifacts/${name}`;
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as Artifact;
}

function ok(artifact: Artifact | null, key: string) {
  return Boolean(artifact?.checks?.[key]);
}

function coverageHash(value: unknown) {
  return `0x${createHash("sha256").update(JSON.stringify(value)).digest("hex")}`;
}

const artifacts = {
  dataPipeline: readArtifact("data-pipeline-latest.json"),
  snapshot: readArtifact("player-snapshot-latest.json"),
  storage: readArtifact("storage-latest.json"),
  storageBundle: readArtifact("storage-bundle-latest.json"),
  storageReadback: readArtifact("storage-readback-latest.json"),
  chain: readArtifact("chain-result-latest.json"),
  chainReadback: readArtifact("chain-readback-latest.json"),
  chainEvents: readArtifact("chain-events-latest.json"),
  browserWallet: readArtifact("browser-wallet-latest.json"),
  wagerSettlement: readArtifact("wager-settlement-latest.json"),
  compute: readArtifact("compute-latest.json"),
  computeBroker: readArtifact("compute-broker-latest.json"),
  computeRuntime: readArtifact("compute-runtime-latest.json"),
  runtimeFinalize: readArtifact("runtime-finalize-latest.json"),
  da: readArtifact("da-latest.json"),
  daStack: readArtifact("da-stack-readiness-latest.json"),
  daSidecar: readArtifact("da-sidecar-latest.json"),
  cloudflareTunnel: readArtifact("cloudflare-tunnel-latest.json"),
  agenticId: readArtifact("agentic-id-latest.json"),
  agenticRegistry: readArtifact("agentic-registry-latest.json"),
  agenticReadback: readArtifact("agentic-id-readback-latest.json"),
  agentManagerReadback: readArtifact("agent-manager-readback-latest.json"),
};

const coverage: Coverage[] = [
  {
    id: "data-pipeline-import-publish",
    label: "Player data import, rating, publish pipeline",
    layer: "data",
    status: artifacts.dataPipeline?.status === "verified" && ok(artifacts.dataPipeline, "historical0GStorageLive") ? "verified" : "missing",
    artifacts: ["data-pipeline-latest.json"],
    uiSurface: "/proof/:roomId",
    proof: `${artifacts.dataPipeline?.workPlayerCount ?? "?"} local pipeline players / ${String((artifacts.dataPipeline?.historicalSnapshot as Record<string, unknown> | undefined)?.playerCount ?? "?")} historical players`,
  },
  {
    id: "historical-player-snapshot",
    label: "Historical World Cup player snapshot",
    layer: "data",
    status: artifacts.snapshot?.status === "live" || artifacts.snapshot?.status === "pending-finality" ? "verified" : "missing",
    artifacts: ["player-snapshot-latest.json"],
    uiSurface: "/proof/:roomId",
    proof: `${artifacts.snapshot?.playerCount ?? "?"} players / ${artifacts.snapshot?.teamCount ?? "?"} squads`,
  },
  {
    id: "storage-proof-packet",
    label: "0G Storage proof packet",
    layer: "storage",
    status: artifacts.storage?.status === "live" && ok(artifacts.storageReadback, "proofMerkleRootMatches") ? "verified" : "missing",
    artifacts: ["storage-latest.json", "storage-readback-latest.json"],
    uiSurface: "/proof/:roomId",
    proof: String(artifacts.storage?.rootHash ?? artifacts.storageReadback?.reason ?? "missing"),
  },
  {
    id: "storage-product-bundle",
    label: "0G Storage product bundle readback",
    layer: "storage",
    status: artifacts.storageBundle?.status === "live" && ok(artifacts.storageReadback, "bundleItemHashesMatch") ? "verified" : "missing",
    artifacts: ["storage-bundle-latest.json", "storage-readback-latest.json"],
    uiSurface: "/proof/:roomId",
    proof: String(artifacts.storageBundle?.bundleHash ?? artifacts.storageReadback?.reason ?? "missing"),
  },
  {
    id: "chain-contracts",
    label: "0G Chain deployed contracts",
    layer: "chain",
    status: ok(artifacts.chainReadback, "contractsHaveCode") ? "verified" : "missing",
    artifacts: ["chain-readback-latest.json"],
    uiSurface: "/proof/:roomId",
    proof: "Draft, Escrow, Results, and Agentic ID contract bytecode checked",
  },
  {
    id: "chain-result-commitment",
    label: "0G Chain result commitment",
    layer: "chain",
    status: artifacts.chain?.status === "submitted" && ok(artifacts.chainEvents, "resultEventFound") ? "verified" : "missing",
    artifacts: ["chain-result-latest.json", "chain-events-latest.json"],
    uiSurface: "/proof/:roomId",
    proof: String(artifacts.chain?.txHash ?? artifacts.chain?.reason ?? "missing"),
  },
  {
    id: "browser-wallet-wager-actions",
    label: "Browser wallet commit and wager deposit",
    layer: "wallet",
    status: artifacts.browserWallet?.status === "live" && ok(artifacts.browserWallet, "depositEventFound") ? "verified" : "missing",
    artifacts: ["browser-wallet-latest.json"],
    uiSurface: "/proof/:roomId",
    proof: String((artifacts.browserWallet?.transactions as Record<string, unknown> | undefined)?.deposit ?? "missing"),
  },
  {
    id: "wager-settlement",
    label: "0G wager settlement and payout",
    layer: "chain",
    status: artifacts.wagerSettlement?.status === "settled" && ok(artifacts.wagerSettlement, "winnerReceivedPayout") ? "verified" : "missing",
    artifacts: ["wager-settlement-latest.json"],
    uiSurface: "/proof/:roomId",
    proof: String((artifacts.wagerSettlement?.transactions as Record<string, unknown> | undefined)?.settle ?? "missing"),
  },
  {
    id: "compute-router",
    label: "0G Compute Router",
    layer: "compute",
    status: artifacts.compute?.status === "live" ? "verified" : artifacts.compute?.status === "blocked" ? "external-blocked" : "missing",
    artifacts: ["compute-latest.json", "infra-diagnostics-latest.json"],
    uiSurface: "/simulate/:roomId and /proof/:roomId",
    proof: String(artifacts.compute?.reason ?? artifacts.compute?.model ?? "missing"),
  },
  {
    id: "compute-broker",
    label: "Direct 0G Compute broker",
    layer: "compute",
    status: artifacts.computeBroker?.status === "ready" ? "ready" : artifacts.computeBroker?.status === "blocked" ? "external-blocked" : "missing",
    artifacts: ["compute-broker-latest.json"],
    uiSurface: "/proof/:roomId",
    proof: String(artifacts.computeBroker?.reason ?? "missing"),
  },
  {
    id: "runtime-compute-authority",
    label: "Runtime match compute authority",
    layer: "compute",
    status: artifacts.computeRuntime?.status === "live" ? "verified" : artifacts.computeRuntime?.status === "blocked" ? "external-blocked" : "missing",
    artifacts: ["compute-runtime-latest.json", "runtime-finalize-latest.json"],
    uiSurface: "/simulate/:roomId",
    proof: String(artifacts.computeRuntime?.reason ?? artifacts.runtimeFinalize?.reason ?? "missing"),
  },
  {
    id: "runtime-finalization-guard",
    label: "Runtime finalization guard",
    layer: "compute",
    status: artifacts.runtimeFinalize?.status === "live" || ok(artifacts.runtimeFinalize, "rejectedDeterministicResult") ? "verified" : "missing",
    artifacts: ["runtime-finalize-latest.json"],
    uiSurface: "/simulate/:roomId and /proof/:roomId",
    proof: String(artifacts.runtimeFinalize?.reason ?? "compute-authoritative finalization"),
  },
  {
    id: "da-byte-ready-batch",
    label: "0G DA byte-ready batch",
    layer: "da",
    status: artifacts.da?.blobReady === true ? "ready" : "missing",
    artifacts: ["da-latest.json", "da-batch-payload-latest.json"],
    uiSurface: "/proof/:roomId",
    proof: artifacts.da?.blobReady === true ? "DA blob is byte-ready and below the documented 0G DA max size." : "missing",
  },
  {
    id: "da-local-stack",
    label: "0G DA local sidecar/client stack",
    layer: "da",
    status: artifacts.daStack?.status === "ready" ? "verified" : artifacts.daStack?.status === "blocked" ? "external-blocked" : "missing",
    artifacts: ["da-stack-readiness-latest.json"],
    uiSurface: "/proof/:roomId",
    proof: String(artifacts.daStack?.reason ?? "missing"),
  },
  {
    id: "da-sidecar-submit",
    label: "0G DA sidecar submit",
    layer: "da",
    status: artifacts.daSidecar?.status === "submitted" || artifacts.daSidecar?.status === "live" ? "verified" : artifacts.daSidecar?.status === "blocked" ? "external-blocked" : "missing",
    artifacts: ["da-sidecar-latest.json"],
    uiSurface: "/proof/:roomId",
    proof: String(artifacts.daSidecar?.reason ?? artifacts.daSidecar?.requestId ?? "missing"),
  },
  {
    id: "cloudflare-tunnel-bridge",
    label: "Cloudflare tunnel bridge",
    layer: "ui",
    status: artifacts.cloudflareTunnel?.status === "configured" ? "verified" : artifacts.cloudflareTunnel?.status === "local-only" ? "local-only" : "missing",
    artifacts: ["cloudflare-tunnel-latest.json"],
    uiSurface: "/proof/:roomId",
    proof: String(artifacts.cloudflareTunnel?.reason ?? "missing"),
  },
  {
    id: "agentic-id-mint",
    label: "Agentic ID mint",
    layer: "agentic",
    status: artifacts.agenticId?.status === "minted" || artifacts.agenticId?.status === "live" ? "verified" : "missing",
    artifacts: ["agentic-id-latest.json", "chain-events-latest.json"],
    uiSurface: "/agents and /proof/:roomId",
    proof: String(artifacts.agenticId?.mintTxHash ?? artifacts.agenticId?.txHash ?? "missing"),
  },
  {
    id: "agentic-registry",
    label: "Agentic registry",
    layer: "agentic",
    status: artifacts.agenticRegistry?.status === "minted" || artifacts.agenticRegistry?.status === "live" ? "verified" : "missing",
    artifacts: ["agentic-registry-latest.json"],
    uiSurface: "/agents and /proof/:roomId",
    proof: `${artifacts.agenticRegistry?.count ?? 0} agents`,
  },
  {
    id: "agentic-storage-readback",
    label: "Agentic ID encrypted metadata readback",
    layer: "agentic",
    status:
      artifacts.agenticReadback?.status === "live" &&
      ok(artifacts.agenticReadback, "everyAgentDownloaded") &&
      ok(artifacts.agenticReadback, "everyDecryptedAgentMatches")
        ? "verified"
        : "missing",
    artifacts: ["agentic-id-readback-latest.json"],
    uiSurface: "/proof/:roomId",
    proof: String(artifacts.agenticReadback?.contentHash ?? "missing"),
  },
  {
    id: "agent-manager-live-readback",
    label: "Agent Manager live readback",
    layer: "agentic",
    status:
      artifacts.agentManagerReadback?.status === "live" &&
      ok(artifacts.agentManagerReadback, "everyAgentHasChainEvent") &&
      ok(artifacts.agentManagerReadback, "allAgentTokenReadback") &&
      ok(artifacts.agentManagerReadback, "allAgentMetadataReadback")
        ? "verified"
        : "missing",
    artifacts: ["agent-manager-readback-latest.json"],
    uiSurface: "/agents and /proof/:roomId",
    proof: String(artifacts.agentManagerReadback?.readbackHash ?? artifacts.agentManagerReadback?.reason ?? "missing"),
  },
];

const counts = coverage.reduce<Record<Coverage["status"], number>>((acc, item) => {
  acc[item.status] += 1;
  return acc;
}, { verified: 0, ready: 0, "external-blocked": 0, "local-only": 0, missing: 0 });

const artifact = {
  schema: "0g-world-cup-integration-matrix-v1",
  status: counts.missing > 0 ? "incomplete" : counts["external-blocked"] > 0 ? "externally-blocked" : "verified",
  generatedAt: new Date(0).toISOString(),
  coverage,
  counts,
  coverageHash: coverageHash(coverage),
  blockers: coverage.filter((item) => item.status === "external-blocked" || item.status === "missing" || item.status === "local-only"),
  env: publicEnvSummary(),
};

writeProofArtifact("integration-matrix-latest.json", artifact);
console.log(JSON.stringify(artifact, null, 2));
