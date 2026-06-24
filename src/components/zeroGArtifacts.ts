export type Artifact = Record<string, unknown> & {
  status?: string;
  txHash?: string;
  transactions?: Record<string, string>;
  storageUri?: string;
  rootHash?: string;
  blobHash?: string;
  bundleHash?: string;
  contentHash?: string;
  blockNumber?: string;
  blockNumbers?: Record<string, string>;
  contract?: string;
  canStart?: boolean;
  encryptedMetadataHash?: string;
  mintTxHash?: string;
  reason?: string;
  tokenId?: string;
  items?: string[];
  downloadedRoots?: string[];
  downloadedMerkleRoot?: string;
  byteCount?: number;
  checks?: Record<string, boolean>;
  count?: number;
  coverage?: { id?: string; label?: string; status?: string; layer?: string; proof?: string }[];
  counts?: Record<string, number>;
  coverageHash?: string;
  readbackHash?: string;
  pipelineHash?: string;
  selectedSource?: string;
  workPlayerCount?: number;
  workSnapshotHash?: string;
  publishedSnapshotHash?: string;
  historicalSnapshot?: Record<string, unknown>;
  cloudflareManifest?: Record<string, unknown>;
  agents?: Record<string, unknown>[];
  escrow?: Record<string, unknown>;
  storage?: Record<string, unknown>;
  chain?: Record<string, unknown>;
  compute?: {
    endpoint?: string;
    live?: boolean;
    reason?: string;
    probes?: { source?: string; endpoint?: string; model?: string; statusCode?: number; errorCode?: string; message?: string; ok?: boolean }[];
  };
  broker?: {
    serviceCount?: number;
    preferredService?: { provider?: string; model?: string; serviceType?: string; verifiability?: string } | null;
    metadata?: { endpoint?: string; model?: string; error?: string } | null;
    error?: string | null;
  };
  wallet?: {
    address?: string | null;
    nativeBalanceOg?: string | null;
    minimumLedgerOg?: number;
    requiredTopUpOg?: string;
    canFundMinimumLedger?: boolean;
  };
  ledger?: {
    readable?: boolean;
    exists?: boolean;
    error?: string | null;
  };
  da?: {
    reason?: string;
    daClientGrpc?: string;
    stackStatus?: string;
    stackReason?: string;
    daEntrance?: { address?: string; hasCode?: boolean; codeBytes?: number; reason?: string } | null;
    daEntranceCandidates?: { address?: string; hasCode?: boolean; codeBytes?: number; reason?: string }[];
    daEntranceHasCode?: boolean;
    anyDocumentedDaEntranceHasCode?: boolean;
    officialMaxBlobBytes?: number;
    daClientListening?: boolean;
    encoderListening?: boolean;
    retrieverListening?: boolean;
    sidecar?: { reachable?: boolean; statusCode?: number };
  };
  docker?: {
    installed?: boolean;
    daemonReachable?: boolean;
    composeAvailable?: boolean;
    daemon?: string;
  };
  endpoints?: {
    daClientGrpc?: string;
    sidecarListening?: boolean;
    daClientListening?: boolean;
    encoderListening?: boolean;
    retrieverListening?: boolean;
  };
  tunnel?: {
    sidecarUrl?: string;
    appUrl?: string;
    configuredPublicSidecar?: boolean;
    configuredPublicApp?: boolean;
    sidecarHealth?: { reachable?: boolean; statusCode?: number };
    appHealth?: { reachable?: boolean; statusCode?: number };
  };
  cloudflared?: {
    installed?: boolean;
    version?: string;
    reason?: string;
  };
  costModel?: {
    workersPaidMinimumUsdPerMonth?: number;
    requestsIncludedPerMonth?: number;
    requestsOverageUsdPerMillion?: number;
    cpuIncludedMsPerMonth?: number;
    cpuOverageUsdPerMillionMs?: number;
  };
  playerCount?: number;
  teamCount?: number;
  snapshotHash?: string;
  output?: {
    authority?: string;
    computeMode?: string;
    blocker?: string;
    receipt?: { path?: string; provider?: string; model?: string; teeVerified?: boolean | null };
  };
};

export const artifactFiles = [
  ["player-snapshot-latest.json", "0G Player Snapshot"],
  ["data-pipeline-latest.json", "Player Data Pipeline"],
  ["integration-matrix-latest.json", "0G Integration Matrix"],
  ["storage-latest.json", "0G Storage"],
  ["storage-bundle-latest.json", "0G Storage Bundle"],
  ["storage-readback-latest.json", "0G Storage Readback"],
  ["chain-result-latest.json", "0G Results Contract"],
  ["chain-readback-latest.json", "0G Chain Readback"],
  ["chain-events-latest.json", "0G Chain Events"],
  ["escrow-readiness-latest.json", "0G Escrow Readiness"],
  ["browser-wallet-latest.json", "Browser Wallet E2E"],
  ["wager-settlement-latest.json", "0G Wager Settlement"],
  ["compute-latest.json", "0G Compute Router"],
  ["compute-broker-latest.json", "0G Compute Broker"],
  ["compute-runtime-latest.json", "0G Runtime Compute"],
  ["infra-diagnostics-latest.json", "0G Infra Diagnostics"],
  ["runtime-finalize-latest.json", "Runtime Room Finalization"],
  ["cloudflare-tunnel-latest.json", "Cloudflare Tunnel"],
  ["da-latest.json", "0G DA Batch"],
  ["da-stack-readiness-latest.json", "0G DA Stack Readiness"],
  ["da-sidecar-latest.json", "0G DA Sidecar"],
  ["agentic-id-latest.json", "Agentic ID"],
  ["agentic-registry-latest.json", "Agentic ID Registry"],
  ["agentic-id-readback-latest.json", "Agentic ID Readback"],
  ["agent-manager-readback-latest.json", "Agent Manager Readback"],
] as const;

export async function loadArtifact(file: string): Promise<Artifact | null> {
  try {
    const response = await fetch(`/proof-artifacts/${file}`, { cache: "no-store" });
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) return null;
    return await response.json() as Artifact;
  } catch {
    return null;
  }
}
