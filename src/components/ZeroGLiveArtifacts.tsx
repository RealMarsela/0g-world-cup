import { useEffect, useState } from "react";
import { Badge, Panel } from "./ui";

type Artifact = Record<string, unknown> & {
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
  agents?: Record<string, unknown>[];
  escrow?: Record<string, unknown>;
  storage?: Record<string, unknown>;
  chain?: Record<string, unknown>;
  compute?: {
    endpoint?: string;
    live?: boolean;
    reason?: string;
    probes?: { model?: string; statusCode?: number; errorCode?: string; message?: string; ok?: boolean }[];
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

const files = [
  ["player-snapshot-latest.json", "0G Player Snapshot"],
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
  ["da-latest.json", "0G DA Batch"],
  ["da-stack-readiness-latest.json", "0G DA Stack Readiness"],
  ["da-sidecar-latest.json", "0G DA Sidecar"],
  ["agentic-id-latest.json", "Agentic ID"],
  ["agentic-registry-latest.json", "Agentic ID Registry"],
  ["agentic-id-readback-latest.json", "Agentic ID Readback"],
] as const;

async function loadArtifact(file: string): Promise<Artifact | null> {
  try {
    const response = await fetch(`/proof-artifacts/${file}`, { cache: "no-store" });
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) return null;
    return await response.json() as Artifact;
  } catch {
    return null;
  }
}

export function ZeroGLiveArtifacts() {
  const [artifacts, setArtifacts] = useState<Record<string, Artifact | null>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(files.map(async ([file]) => [file, await loadArtifact(file)] as const)).then((entries) => {
      if (!cancelled) setArtifacts(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Panel className="p-5" data-testid="zero-g-live-artifacts">
      <Badge tone="ok">Live script evidence</Badge>
      <h2 className="mt-3 text-2xl font-bold">Latest 0G artifacts</h2>
      <div className="mt-4 grid gap-3">
        {files.map(([file, label]) => {
          const artifact = artifacts[file];
          return (
            <div className="rounded-md border border-white/10 bg-white/[0.035] p-3" key={file}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{label}</h3>
                <Badge tone={artifact?.status === "live" || artifact?.status === "submitted" || artifact?.status === "ready" || artifact?.status === "minted" ? "ok" : "warn"}>
                  {artifact?.status ?? "waiting"}
                </Badge>
              </div>
              {artifact ? (
                <div className="mt-2 grid gap-1 text-xs text-muted">
                  {artifact.txHash && <p className="break-all font-mono">tx {artifact.txHash}</p>}
                  {artifact.transactions && Object.entries(artifact.transactions).map(([key, value]) => (
                    <p className="break-all font-mono" key={key}>{key} tx {value}</p>
                  ))}
                  {artifact.mintTxHash && <p className="break-all font-mono">mint {artifact.mintTxHash}</p>}
                  {artifact.rootHash && <p className="break-all font-mono">root {artifact.rootHash}</p>}
                  {artifact.snapshotHash && <p className="break-all font-mono">snapshot {artifact.snapshotHash}</p>}
                  {artifact.playerCount && <p className="font-mono">{artifact.playerCount} players / {artifact.teamCount ?? "?"} squads</p>}
                  {artifact.blobHash && <p className="break-all font-mono">blob {artifact.blobHash}</p>}
                  {artifact.bundleHash && <p className="break-all font-mono">bundle {artifact.bundleHash}</p>}
                  {artifact.contentHash && <p className="break-all font-mono">content {artifact.contentHash}</p>}
                  {artifact.encryptedMetadataHash && <p className="break-all font-mono">metadata {artifact.encryptedMetadataHash}</p>}
                  {artifact.contract && <p className="break-all font-mono">contract {artifact.contract}</p>}
                  {typeof artifact.canStart === "boolean" && <p className="font-mono">canStart {String(artifact.canStart)}</p>}
                  {artifact.escrow && (
                    <p className="break-all font-mono">
                      escrow deposits {String(artifact.escrow.depositCount ?? "?")} / wagerWei {String(artifact.escrow.wagerAmountWei ?? "?")} / settled {String(artifact.escrow.settled ?? "?")}
                    </p>
                  )}
                  {artifact.tokenId && <p className="font-mono">token {artifact.tokenId}</p>}
                  {artifact.blockNumber && <p className="font-mono">block {artifact.blockNumber}</p>}
                  {artifact.blockNumbers && <p className="font-mono">blocks {Object.values(artifact.blockNumbers).join(" / ")}</p>}
                  {artifact.byteCount && <p className="font-mono">{artifact.byteCount} bytes read back</p>}
                  {artifact.storageUri && <p className="break-all font-mono">{artifact.storageUri}</p>}
                  {artifact.downloadedRoots && <p className="break-all font-mono">read {artifact.downloadedRoots.join(" / ")}</p>}
                  {artifact.downloadedMerkleRoot && <p className="break-all font-mono">read {artifact.downloadedMerkleRoot}</p>}
                  {artifact.items && <p>{artifact.items.join(" / ")}</p>}
                  {artifact.checks && <p>{Object.entries(artifact.checks).map(([key, ok]) => `${key}:${ok ? "ok" : "fail"}`).join(" / ")}</p>}
                  {artifact.count && <p className="font-mono">{artifact.count} agents</p>}
                  {artifact.agents && artifact.agents.map((agent) => (
                    <p className="break-all font-mono" key={String(agent.agentId)}>
                      {String(agent.agentId)} root {String(agent.rootHash)} policy {String(agent.policyHash)}
                    </p>
                  ))}
                  {artifact.storage && <p className="break-all font-mono">runtime storage {String(artifact.storage.storageUri ?? artifact.storage.reason ?? "pending")}</p>}
                  {artifact.chain && <p className="break-all font-mono">runtime chain {String(artifact.chain.status ?? "pending")} {String(artifact.chain.txHash ?? "")}</p>}
                  {artifact.compute && (
                    <p className="break-all font-mono">
                      compute {String(artifact.compute.endpoint ?? "")} / live {String(artifact.compute.live)} / {String(artifact.compute.reason ?? "")}
                    </p>
                  )}
                  {artifact.compute?.probes?.map((probe) => (
                    <p className="break-all font-mono" key={String(probe.model)}>
                      {String(probe.model)} status {String(probe.statusCode)} {String(probe.errorCode ?? probe.message ?? "")}
                    </p>
                  ))}
                  {artifact.wallet && (
                    <p className="break-all font-mono">
                      broker wallet {String(artifact.wallet.address ?? "missing")} / balance {String(artifact.wallet.nativeBalanceOg ?? "?")} 0G / can fund {String(artifact.wallet.canFundMinimumLedger)}
                    </p>
                  )}
                  {artifact.broker && (
                    <p className="break-all font-mono">
                      broker services {String(artifact.broker.serviceCount ?? 0)} / provider {String(artifact.broker.preferredService?.provider ?? "missing")} / model {String(artifact.broker.metadata?.model ?? artifact.broker.preferredService?.model ?? "unknown")}
                    </p>
                  )}
                  {artifact.broker?.metadata?.endpoint && <p className="break-all font-mono">broker endpoint {artifact.broker.metadata.endpoint}</p>}
                  {artifact.broker?.metadata?.error && <p>{artifact.broker.metadata.error}</p>}
                  {artifact.broker?.error && <p>{artifact.broker.error}</p>}
                  {artifact.ledger && (
                    <p className="break-all font-mono">
                      ledger readable {String(artifact.ledger.readable)} / exists {String(artifact.ledger.exists)} / {String(artifact.ledger.error ?? "")}
                    </p>
                  )}
                  {artifact.output && (
                    <p className="break-all font-mono">
                      runtime compute {String(artifact.output.authority)} / {String(artifact.output.computeMode)} / path {String(artifact.output.receipt?.path ?? "blocked")}
                    </p>
                  )}
                  {artifact.output?.receipt?.provider && <p className="break-all font-mono">runtime provider {artifact.output.receipt.provider}</p>}
                  {artifact.output?.blocker && <p>{artifact.output.blocker}</p>}
                  {artifact.da && (
                    <p className="break-all font-mono">
                      da client {String(artifact.da.daClientGrpc || "missing")} / 51001 {String(artifact.da.daClientListening)} / encoder {String(artifact.da.encoderListening)} / retriever {String(artifact.da.retrieverListening)}
                    </p>
                  )}
                  {artifact.da?.reason && <p>{artifact.da.reason}</p>}
                  {artifact.docker && (
                    <p className="break-all font-mono">
                      docker installed {String(artifact.docker.installed)} / daemon {String(artifact.docker.daemonReachable)} / compose {String(artifact.docker.composeAvailable)}
                    </p>
                  )}
                  {artifact.endpoints && (
                    <p className="break-all font-mono">
                      da stack grpc {String(artifact.endpoints.daClientGrpc || "missing")} / sidecar {String(artifact.endpoints.sidecarListening)} / client {String(artifact.endpoints.daClientListening)} / encoder {String(artifact.endpoints.encoderListening)} / retriever {String(artifact.endpoints.retrieverListening)}
                    </p>
                  )}
                  {artifact.reason && <p>{artifact.reason}</p>}
                  {!artifact.txHash && !artifact.mintTxHash && !artifact.rootHash && !artifact.storageUri && !artifact.blobHash && !artifact.bundleHash && !artifact.contentHash && !artifact.encryptedMetadataHash && !artifact.contract && !artifact.checks && !artifact.reason && (
                    <p>{String(artifact.reason ?? "Artifact exists without a chain/storage hash.")}</p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted">Run the matching proof script to publish this artifact.</p>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
